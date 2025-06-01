import fs from 'node:fs';
import { log, outro } from '@clack/prompts';
import color from 'chalk';
import { Command, program } from 'commander';
import ignore from 'ignore';
import path from 'pathe';
import semver from 'semver';
import * as tar from 'tar';
import * as v from 'valibot';
import type { Category } from '../types';
import * as ascii from '../utils/ascii';
import { buildBlocksDirectory, buildConfigFiles, pruneUnused } from '../utils/build';
import { DEFAULT_CONFIG, runRules } from '../utils/build/check';
import { IGNORED_DIRS, IGNORED_FILES, type RegistryConfig, getRegistryConfig } from '../utils/config';
import { iFetch } from '../utils/fetch';
import { createManifest } from '../utils/manifest';
import type { PackageJson } from '../utils/package';
import { intro, spinner } from '../utils/prompts';
import * as jsrepo from '../utils/registry-providers/jsrepo';
import { TokenManager } from '../utils/token-manager';

const schema = v.object({
	private: v.boolean(),
	dryRun: v.boolean(),
	name: v.optional(v.string()),
	ver: v.optional(v.string()),
	dirs: v.optional(v.array(v.string())),
	includeBlocks: v.optional(v.array(v.string())),
	includeCategories: v.optional(v.array(v.string())),
	excludeBlocks: v.optional(v.array(v.string())),
	excludeCategories: v.optional(v.array(v.string())),
	excludeDeps: v.optional(v.array(v.string())),
	listBlocks: v.optional(v.array(v.string())),
	listCategories: v.optional(v.array(v.string())),
	doNotListBlocks: v.optional(v.array(v.string())),
	doNotListCategories: v.optional(v.array(v.string())),
	allowSubdirectories: v.optional(v.boolean()),
	verbose: v.boolean(),
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

export const publish = new Command('publish')
	.description('Publish a registry to jsrepo.com.')
	.option(
		'--private',
		'When publishing the first version of the registry make it private.',
		false
	)
	.option('--dry-run', "Test the publish but don't list on jsrepo.com.", false)
	.option('--name <name>', 'The name of the registry. i.e. @ieedan/std')
	.option('--ver <version>', 'The version of the registry. i.e. 0.0.1')
	.option('--dirs [dirs...]', 'The directories containing the blocks.')
	.option('--include-blocks [blockNames...]', 'Include only the blocks with these names.')
	.option(
		'--include-categories [categoryNames...]',
		'Include only the categories with these names.'
	)
	.option('--exclude-blocks [blockNames...]', 'Do not include the blocks with these names.')
	.option(
		'--exclude-categories [categoryNames...]',
		'Do not include the categories with these names.'
	)
	.option('--list-blocks [blockNames...]', 'List only the blocks with these names.')
	.option('--list-categories [categoryNames...]', 'List only the categories with these names.')
	.option('--do-not-list-blocks [blockNames...]', 'Do not list the blocks with these names.')
	.option(
		'--do-not-list-categories [categoryNames...]',
		'Do not list the categories with these names.'
	)
	.option('--exclude-deps [deps...]', 'Dependencies that should not be added.')
	.option('--allow-subdirectories', 'Allow subdirectories to be built.')
	.option('--verbose', 'Include debug logs.', false)
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (opts) => {
		const options = v.parse(schema, opts);

		await intro();

		await _publish(options);

		outro(color.green('All done!'));
	});

async function _publish(options: Options) {
	const verbose = (msg: string) => {
		if (options.verbose) {
			console.info(`${ascii.INFO} ${msg}`);
		}
	};

	const loading = spinner({ verbose: options.verbose ? verbose : undefined });

	const config: RegistryConfig = getRegistryConfig(options.cwd).match(
		(val) => {
			if (val === null) {
				return {
					$schema: '',
					access: 'public',
					readme: 'README.md',
					dirs: options.dirs ?? [],
					doNotListBlocks: options.doNotListBlocks ?? [],
					doNotListCategories: options.doNotListCategories ?? [],
					listBlocks: options.listBlocks ?? [],
					listCategories: options.listCategories ?? [],
					excludeDeps: options.excludeDeps ?? [],
					includeBlocks: options.includeBlocks ?? [],
					includeCategories: options.includeCategories ?? [],
					excludeBlocks: options.excludeBlocks ?? [],
					excludeCategories: options.excludeCategories ?? [],
					allowSubdirectories: options.allowSubdirectories,
				} satisfies RegistryConfig;
			}

			const mergedVal = val;

			// overwrites config with flag values

			if (options.private) mergedVal.access = 'private';
			if (options.name) mergedVal.name = options.name;
			if (options.ver) mergedVal.version = options.ver;
			if (options.dirs) mergedVal.dirs = options.dirs;
			if (options.doNotListBlocks) mergedVal.doNotListBlocks = options.doNotListBlocks;
			if (options.doNotListCategories)
				mergedVal.doNotListCategories = options.doNotListCategories;
			if (options.listBlocks) mergedVal.listBlocks = options.listBlocks;
			if (options.listCategories) mergedVal.listCategories = options.listCategories;
			if (options.includeBlocks) mergedVal.includeBlocks = options.includeBlocks;
			if (options.includeCategories) mergedVal.includeCategories = options.includeCategories;
			if (options.excludeBlocks) mergedVal.excludeBlocks = options.excludeBlocks;
			if (options.excludeCategories) mergedVal.excludeCategories = options.excludeCategories;
			if (options.excludeDeps) mergedVal.excludeDeps = options.excludeDeps;
			if (options.allowSubdirectories !== undefined)
				mergedVal.allowSubdirectories = options.allowSubdirectories;

			mergedVal.rules = { ...DEFAULT_CONFIG, ...mergedVal.rules };

			return mergedVal;
		},
		(err) => program.error(color.red(err))
	);

	if (options.dryRun) {
		log.warn(color.bgYellow.black(' DRY RUN '));
	}

	// -- pre-flights --

	// check name
	if (config.name !== undefined) {
		try {
			const [scope, registryName, ...rest] = config.name.split('/');

			if (rest.length > 0) {
				throw new Error();
			}

			if (!scope.startsWith('@')) {
				throw new Error();
			}

			if (!scope.slice(1).match(jsrepo.NAME_REGEX)) {
				throw new Error();
			}

			if (!registryName.match(jsrepo.NAME_REGEX)) {
				throw new Error();
			}
		} catch {
			program.error(
				color.red(
					`\`${config.name}\` is not a valid name. The name should be provided as \`@<scope>/<registry>\``
				)
			);
		}
	} else {
		program.error(
			color.red(
				`To publish to ${color.bold('jsrepo.com')} you need to provide the \`name\` field in the \`jsrepo-build-config.json\``
			)
		);
	}

	// check version
	if (config.version !== undefined) {
		// use version from package.json
		if (config.version === 'package') {
			const packagePath = path.join(options.cwd, 'package.json');

			if (!fs.existsSync(packagePath)) {
				program.error(color.red(`Couldn't find your ${color.bold('package.json')}!`));
			}

			const { version } = JSON.parse(fs.readFileSync(packagePath).toString()) as PackageJson;

			config.version = version;
		}

		const valid = semver.valid(config.version);

		if (!valid) {
			program.error(`\`${config.version}\` is not a valid semver version.`);
		}
	} else {
		program.error(
			color.red(
				`To publish to ${color.bold('jsrepo.com')} you need to provide the \`version\` field in the \`jsrepo-build-config.json\``
			)
		);
	}

	const apiKey = new TokenManager().get('jsrepo');

	if (apiKey === undefined) {
		program.error(
			color.red(
				`Please authenticate with ${color.cyan('jsrepo auth')} to publish to ${ascii.JSREPO_DOT_COM}.`
			)
		);
	}

	// build into temp dir
	const categories: Category[] = [];

	const ig = ignore();

	try {
		const ignoreFile = fs.readFileSync(path.join(options.cwd, '.gitignore')).toString();

		ig.add(ignoreFile);
	} catch {
		// just continue on
	}

	ig.add(IGNORED_DIRS);
	ig.add(IGNORED_FILES);

	for (const dir of config.dirs) {
		const dirPath = path.join(options.cwd, dir);

		loading.start(`Building ${color.cyan(dirPath)}`);

		const builtCategories = buildBlocksDirectory(dirPath, {
			cwd: options.cwd,
			ignore: ig,
			config,
		});

		for (const category of builtCategories) {
			if (categories.find((cat) => cat.name === category.name) !== undefined) {
				console.warn(
					`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped adding \`${color.cyan(`${dir}/${category.name}`)}\` because a category with the same name already exists!`
				);
				continue;
			}

			categories.push(category);
		}

		loading.stop(`Built ${color.cyan(dirPath)}`);
	}

	const configFiles = buildConfigFiles(config, { cwd: options.cwd });

	const manifest = createManifest(categories, configFiles, config);

	loading.start('Checking manifest');

	const { warnings, errors } = runRules(manifest, config, options.cwd, config.rules);

	loading.stop('Completed checking manifest.');

	// add gap for errors
	if (warnings.length > 0 || errors.length > 0) {
		console.log(ascii.VERTICAL_LINE);
	}

	for (const warning of warnings) {
		console.log(warning);
	}

	if (errors.length > 0) {
		for (const error of errors) {
			console.log(error);
		}

		program.error(
			color.red(
				`Completed checking manifest with ${color.bold(`${errors.length} error(s)`)} and ${color.bold(`${warnings.length} warning(s)`)}`
			)
		);
	}

	// removes any unused blocks or categories
	const [prunedCategories, count] = pruneUnused(manifest.categories);

	manifest.categories = prunedCategories;

	if (count > 0) {
		log.step(`Removed ${count} unused block${count > 1 ? 's' : ''}.`);
	}

	loading.start(`Packaging ${color.cyan(manifest.name)}...`);

	const tempOutDir = path.resolve(options.cwd, `jsrepo-publish-temp-${Date.now()}`);

	verbose(`Creating temp dir: ${tempOutDir}`);

	fs.mkdirSync(tempOutDir, { recursive: true });

	verbose('Writing manifest to temp dir');

	// write manifest
	fs.writeFileSync(path.resolve(tempOutDir, 'jsrepo-manifest.json'), JSON.stringify(manifest));

	// try copy readme
	const readmePath = path.resolve(options.cwd, config.readme);

	try {
		verbose('Attempting to copy readme');

		fs.copyFileSync(readmePath, path.join(tempOutDir, 'README.md'));

		verbose('Copied readme');
	} catch {
		// do nothing it's okay
		verbose('No readme found.');
	}

	// copy config files to output directory
	if (manifest.configFiles) {
		verbose('Copying config files');

		for (const file of manifest.configFiles) {
			const originalPath = path.join(options.cwd, file.path);
			const destPath = path.join(tempOutDir, file.path);

			const containing = path.join(destPath, '../');

			if (!fs.existsSync(containing)) {
				fs.mkdirSync(containing, { recursive: true });
			}

			fs.copyFileSync(originalPath, destPath);
		}

		verbose('Copied config files');
	}

	verbose('Copying registry files');

	// copy the files for each block in each category
	for (const category of manifest.categories) {
		for (const block of category.blocks) {
			const originalPath = path.join(options.cwd, block.directory);
			const newDirPath = path.join(tempOutDir, block.directory);

			for (const file of block.files) {
				const containing = path.join(newDirPath, file, '../');

				if (!fs.existsSync(containing)) {
					fs.mkdirSync(containing, { recursive: true });
				}

				fs.copyFileSync(path.join(originalPath, file), path.join(newDirPath, file));
			}
		}
	}

	verbose('Copied registry files');

	const dest = path.resolve(options.cwd, `${config.name.replace('/', '_')}-package.tar.gz`);

	const files = fs.readdirSync(tempOutDir);

	verbose('Creating archive file');

	await tar.create(
		{
			z: true,
			cwd: tempOutDir,
			file: dest,
		},
		files
	);

	verbose('Created archive file');

	verbose('Removing temp directory');

	// remove temp directory
	fs.rmSync(tempOutDir, { force: true, recursive: true });

	verbose('Removed temp directory');

	loading.stop(`Created package ${color.cyan(dest)}...`);

	const access = config.access ?? 'public';

	log.info(`Publishing to jsrepo with the access set to ${color.cyan(access)}`);

	loading.start(`Publishing ${color.bold(manifest.name)} to ${ascii.JSREPO_DOT_COM}...`);

	const tarBuffer = fs.readFileSync(dest);

	verbose('Removing archive file');

	// remove archive file
	fs.rmSync(dest, { force: true, recursive: true });

	verbose('Removed archive file');

	verbose(`Publishing to ${`${jsrepo.BASE_URL}/api/publish`}`);

	const response = await iFetch(`${jsrepo.BASE_URL}/api/publish`, {
		body: tarBuffer,
		headers: {
			'content-type': 'application/gzip',
			'content-encoding': 'gzip',
			'x-api-key': apiKey,
			'x-dry-run': options.dryRun ? '1' : '0',
			'x-access': access,
		},
		method: 'POST',
	});

	loading.stop(`Got response from ${ascii.JSREPO_DOT_COM}.`);

	if (!response.ok) {
		const res = (await response.json()) as { message: string };

		program.error(
			color.red(`${color.bold('[jsrepo.com]')} ${color.bold(response.status)} ${res.message}`)
		);
	} else {
		const res = (await response.json()) as PublishResponse;

		if (res.status === 'dry-run') {
			log.success(`${color.hex('#f7df1e').bold('[jsrepo.com]')} Completed dry run!`);
		} else {
			log.success(
				`${color.hex('#f7df1e').bold('[jsrepo.com]')} published ${color.greenBright(`@${res.scope}`)}/${res.registry}${color.greenBright(`@${res.version}`)}!`
			);
		}
	}
}

type PublishResponse =
	| {
			status: 'published';
			scope: string;
			registry: string;
			version: string;
			tag: string | null;
			private: boolean;
	  }
	| {
			status: 'dry-run';
	  };
