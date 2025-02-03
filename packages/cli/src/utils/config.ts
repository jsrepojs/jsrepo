import fs from 'node:fs';
import { createPathsMatcher, getTsconfig } from 'get-tsconfig';
import path from 'pathe';
import * as v from 'valibot';
import { type Block, manifestMeta } from '../types';
import { Err, Ok, type Result } from './blocks/types/result';
import { ruleConfigSchema } from './build/check';

const PROJECT_CONFIG_NAME = 'jsrepo.json';
const REGISTRY_CONFIG_NAME = 'jsrepo-build-config.json';

const formatterSchema = v.union([v.literal('prettier'), v.literal('biome')]);

const pathsSchema = v.objectWithRest(
	{
		'*': v.string(),
	},
	v.string()
);

export type Paths = v.InferInput<typeof pathsSchema>;

const projectConfigSchema = v.object({
	$schema: v.string(),
	repos: v.optional(v.array(v.string()), []),
	includeTests: v.boolean(),
	paths: pathsSchema,
	watermark: v.optional(v.boolean(), true),
	formatter: v.optional(formatterSchema),
});

const getProjectConfig = (cwd: string): Result<ProjectConfig, string> => {
	if (!fs.existsSync(path.join(cwd, PROJECT_CONFIG_NAME))) {
		return Err('Could not find your configuration file! Please run `init`.');
	}

	const config = v.safeParse(
		projectConfigSchema,
		JSON.parse(fs.readFileSync(path.join(cwd, PROJECT_CONFIG_NAME)).toString())
	);

	if (!config.success) {
		return Err(`There was an error reading your \`${PROJECT_CONFIG_NAME}\` file!`);
	}

	return Ok(config.output);
};

export type ProjectConfig = v.InferOutput<typeof projectConfigSchema>;

export type Formatter = v.InferOutput<typeof formatterSchema>;

const registryConfigSchema = v.object({
	$schema: v.string(),
	meta: v.optional(v.omit(manifestMeta, ['builtAt'])),
	dirs: v.array(v.string()),
	outputDir: v.optional(v.string()),
	includeBlocks: v.optional(v.array(v.string()), []),
	includeCategories: v.optional(v.array(v.string()), []),
	excludeBlocks: v.optional(v.array(v.string()), []),
	excludeCategories: v.optional(v.array(v.string()), []),
	doNotListBlocks: v.optional(v.array(v.string()), []),
	doNotListCategories: v.optional(v.array(v.string()), []),
	listBlocks: v.optional(v.array(v.string()), []),
	listCategories: v.optional(v.array(v.string()), []),
	excludeDeps: v.optional(v.array(v.string()), []),
	preview: v.optional(v.boolean()),
	rules: v.optional(ruleConfigSchema),
});

const getRegistryConfig = (cwd: string): Result<RegistryConfig | null, string> => {
	if (!fs.existsSync(path.join(cwd, REGISTRY_CONFIG_NAME))) {
		return Ok(null);
	}

	const config = v.safeParse(
		registryConfigSchema,
		JSON.parse(fs.readFileSync(path.join(cwd, REGISTRY_CONFIG_NAME)).toString())
	);

	if (!config.success) {
		return Err(`There was an error reading your \`${REGISTRY_CONFIG_NAME}\` file!`);
	}

	return Ok(config.output);
};

export type RegistryConfig = v.InferOutput<typeof registryConfigSchema>;

/** Resolves the paths relative to the cwd */
const resolvePaths = (paths: Paths, cwd: string): Result<Paths, string> => {
	let config = getTsconfig(cwd, 'tsconfig.json');
	let matcher: ((specifier: string) => string[]) | null = null;

	if (!config) {
		// if we don't find the config at first check for a jsconfig
		config = getTsconfig(cwd, 'jsconfig.json');
	}

	if (config) {
		matcher = createPathsMatcher(config);
	}

	let newPaths: Paths;

	if (!paths['*'].startsWith('.')) {
		if (matcher === null) {
			return Err("Cannot resolve aliases because we couldn't find a tsconfig!");
		}

		newPaths = {
			'*': resolvePath(paths['*'], matcher, cwd),
		};
	} else {
		newPaths = {
			'*': path.relative(cwd, path.join(path.resolve(cwd), paths['*'])),
		};
	}

	for (const [category, p] of Object.entries(paths)) {
		if (category === '*') continue; // we already resolved this one

		if (p.startsWith('.')) {
			newPaths[category] = path.relative(cwd, path.join(path.resolve(cwd), p));
			continue;
		}

		if (matcher === null) {
			return Err("Cannot resolve aliases because we couldn't find a tsconfig!");
		}

		newPaths[category] = resolvePath(p, matcher, cwd);
	}

	return Ok(newPaths);
};

const resolvePath = (
	unresolvedPath: string,
	matcher: (specifier: string) => string[],
	cwd: string
): string => {
	const paths = matcher(unresolvedPath);

	return path.relative(cwd, paths[0]);
};

/** Gets the path where the block should be installed.
 *
 * @param block
 * @param resolvedPaths
 * @param cwd
 * @returns
 */
const getPathForBlock = (block: Block, resolvedPaths: Paths, cwd: string): string => {
	let directory: string;

	if (resolvedPaths[block.category] !== undefined) {
		directory = path.join(cwd, resolvedPaths[block.category]);
	} else {
		directory = path.join(cwd, resolvedPaths['*'], block.category);
	}

	return directory;
};

export {
	PROJECT_CONFIG_NAME,
	REGISTRY_CONFIG_NAME,
	getProjectConfig,
	getRegistryConfig,
	projectConfigSchema,
	registryConfigSchema,
	formatterSchema,
	resolvePaths,
	getPathForBlock,
};
