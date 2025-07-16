import fs from 'node:fs';
import { builtinModules } from 'node:module';
import type { PartialConfiguration } from '@biomejs/wasm-nodejs';
import color from 'chalk';
import { createPathsMatcher } from 'get-tsconfig';
import path from 'pathe';
import type * as prettier from 'prettier';
import validatePackageName from 'validate-npm-package-name';
import * as ascii from '../ascii';
import * as lines from '../blocks/ts/lines';
import { Err, Ok, type Result } from '../blocks/ts/result';
import type { Formatter } from '../config';
import { tryGetTsconfig } from '../files';
import { findNearestPackageJson } from '../package';
import { parsePackageName } from '../parse-package-name';
import { css } from './css';
import { html } from './html';
import { typescript } from './javascript';
import { json, jsonc } from './json';
import { sass } from './sass';
import { svelte } from './svelte';
import { svg } from './svg';
import { vue } from './vue';
import { yaml } from './yaml';

export type ResolvedDependencies = {
	local: string[];
	devDependencies: string[];
	dependencies: string[];
	/** Maps a literal import to a template import to be replaced during add/update */
	imports: Record<string, string>;
};

export type ResolveDependencyOptions = {
	filePath: string;
	/** Only valid for folder based blocks. Helps identify a self dependency */
	containingDir?: string;
	isSubDir: boolean;
	excludeDeps: string[];
	cwd: string;
	dirs: string[];
};

export type FormatOptions = {
	formatter?: Formatter;
	/** Can be used to infer the prettier parser */
	filePath: string;
	prettierOptions: prettier.Options | null;
	biomeOptions: PartialConfiguration | null;
};

export type Lang = {
	/** Matches the supported file types */
	matches: (fileName: string) => boolean;
	/** Reads the file and gets any dependencies from its imports */
	resolveDependencies: (opts: ResolveDependencyOptions) => Result<ResolvedDependencies, string>;
	/** Returns a multiline comment containing the content */
	comment: (content: string) => string;
	format: (code: string, opts: FormatOptions) => Promise<string>;
};

export type ResolveImportOptions = {
	moduleSpecifiers: string[];
	isSubDir: boolean;
	filePath: string;
	/** Only valid for folder based blocks. Helps identify a self dependency */
	containingDir?: string;
	doNotInstall?: string[];
	dirs: string[];
	cwd: string;
};

export function formatError(err: string) {
	return `${lines.join(lines.get(err), {
		prefix: (l) => {
			if (l === 0) return `${ascii.VERTICAL_LINE}  ${ascii.ERROR} `;

			return `${ascii.VERTICAL_LINE}  `;
		},
	})}`;
}

export function resolveImports({
	moduleSpecifiers,
	isSubDir,
	filePath,
	containingDir,
	doNotInstall,
	dirs,
	cwd,
}: ResolveImportOptions): Result<ResolvedDependencies, string[]> {
	const errors: string[] = [];

	const deps = new Set<string>();
	const localDeps = new Set<string>();
	const imports: Record<string, string> = {};

	for (const specifier of moduleSpecifiers) {
		// don't add dependencies to node
		if (builtinModules.includes(specifier) || specifier.startsWith('node:')) continue;

		// check if specifier is a local dependency
		if (specifier.startsWith('.')) {
			const localDep = resolveLocalImport(specifier, isSubDir, {
				filePath,
				containingDir,
				dirs,
				cwd,
			});

			if (localDep.isErr()) {
				errors.push(localDep.unwrapErr());
				continue;
			}

			const dep = localDep.unwrap();

			if (dep) {
				localDeps.add(dep.dependency);
				imports[specifier] = dep.template;
			}

			continue;
		}

		// if specifier wasn't a local dependency then it might be a path alias
		const localDep = tryResolveLocalAlias(specifier, isSubDir, {
			filePath,
			containingDir,
			dirs,
			cwd,
		});

		if (!localDep.isErr()) {
			const dep = localDep.unwrap();

			if (dep) {
				localDeps.add(dep.dependency);
				imports[specifier] = dep.template;
				continue;
			}
		}

		// check if the specifier is a package
		const parsed = parsePackageName(specifier);

		if (!parsed.isErr()) {
			const depInfo = parsed.unwrap();

			if (validatePackageName(depInfo.name).validForNewPackages) {
				deps.add(specifier);
				continue;
			}
		}

		console.warn(
			`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped adding import \`${color.cyan(specifier)}\` from ${filePath}. Reason: Not a valid package name or path alias.`
		);
	}

	if (errors.length > 0) {
		return Err(errors);
	}

	const { devDependencies, dependencies } = resolveRemoteDeps(Array.from(deps), filePath, {
		doNotInstall: doNotInstall ? doNotInstall : [],
	});

	return Ok({
		dependencies,
		devDependencies,
		local: Array.from(localDeps),
		imports,
	} satisfies ResolvedDependencies);
}

type ResolveLocalImportResult = {
	/** The local block that is a dependency */
	dependency: string;
	/** A template used to resolve the import during add/update */
	template: string;
};

function resolveLocalImport(
	mod: string,
	isSubDir: boolean,
	{
		filePath,
		containingDir,
		dropExtension = true,
		alias,
		dirs,
		cwd,
	}: {
		filePath: string;
		containingDir?: string;
		dirs: string[];
		alias?: string;
		modIsFile?: boolean;
		cwd: string;
		dropExtension?: boolean;
	}
): Result<ResolveLocalImportResult | undefined, string> {
	if (isSubDir && (mod.startsWith('./') || mod === '.')) return Ok(undefined);

	// get the actual path to the module
	const modPath = path.join(path.join(filePath, '../'), mod);

	// prevent self reference in subdirectories
	if (containingDir && modPath.startsWith(containingDir)) return Ok(undefined);

	const absPath = path.resolve(modPath);

	// Here we try and find the most specific directory that matches the module.
	// This fixes issues where there are 2 nested directories that both
	// contain the module by simply choosing the more specific path.
	let longestMatch: string | null = null;
	for (const dir of dirs) {
		const containingPath = path.resolve(path.join(cwd, dir));

		if (absPath.startsWith(containingPath)) {
			if (longestMatch === null || longestMatch.length < containingPath.length) {
				longestMatch = containingPath;
			}
		}
	}

	if (longestMatch !== null) {
		return Ok(parsePath(absPath.slice(longestMatch.length + 1), dropExtension));
	}

	return Err(
		`${filePath}:\n${alias ? alias : mod} references code not contained in ${color.bold(dirs.join(', '))} and cannot be resolved.`
	);
}

function parsePath(localPath: string, dropExtension = true): ResolveLocalImportResult {
	let [category, block, ...rest] = localPath.split('/');

	// if undefined we assume we are pointing to the index file
	if (block === undefined) {
		block = 'index';
	}

	let trimmedBlock = block;

	// remove file extension
	if (dropExtension && trimmedBlock.includes('.')) {
		trimmedBlock = trimmedBlock.slice(
			0,
			trimmedBlock.length - path.parse(trimmedBlock).ext.length
		);
	}

	const blockSpecifier = `${category}/${trimmedBlock}`;

	let template = `{{${blockSpecifier}}}`;

	if (rest.length === 0) {
		if (trimmedBlock.length !== block.length) {
			// add extension to template
			template += path.parse(block).ext;
		}
	} else {
		template += `/${rest.join('/')}`;
	}

	return { dependency: blockSpecifier, template };
}

/** Tries to resolve the modules as an alias using the tsconfig. */
function tryResolveLocalAlias(
	mod: string,
	isSubDir: boolean,
	{
		filePath,
		dirs,
		cwd,
		containingDir,
	}: { filePath: string; containingDir?: string; dirs: string[]; cwd: string }
): Result<ResolveLocalImportResult | undefined, string> {
	const configResult = tryGetTsconfig(filePath);

	if (configResult.isErr()) return Err(configResult.unwrapErr());

	const config = configResult.unwrap();

	if (config === null) return Ok(undefined);

	const matcher = createPathsMatcher(config);

	if (matcher) {
		// if the mod is actually remote the returns paths will be empty
		const paths = matcher(mod);

		for (const modPath of paths) {
			const foundMod = searchForModule(modPath);

			if (!foundMod) continue;

			const pathResolved = path.relative(
				path.resolve(path.join(filePath, '../')),
				foundMod.prettyPath
			);

			// if it is not equal the extension has already been dropped
			// we omit the '' extension because it there is no extension there is nothing to be dropped
			const shouldDropExtension = resolutionEquality(foundMod.prettyPath, foundMod.path, [
				'.js',
				'.ts',
			]);

			const localDep = resolveLocalImport(pathResolved, isSubDir, {
				filePath,
				containingDir,
				alias: mod,
				dropExtension: shouldDropExtension,
				dirs,
				cwd,
				modIsFile: foundMod.type === 'file',
			});

			if (localDep.isErr()) return Err(localDep.unwrapErr());

			if (localDep.unwrap()) return Ok(localDep.unwrap()!);

			break;
		}
	}

	return Ok(undefined);
}

/** Node allows no extension or a .js extension or a .ts extension to all resolve to the same place because of this we employ a different method of equality.
 *
 *  Basically we want to treat a path with a .js extension as equal to the same path with a .ts extension and vise versa.
 */
function resolutionEquality(pathA: string, pathB: string, validExtensions = ['.ts', '.js', '']) {
	if (pathA === pathB) return true;

	const parsedA = path.parse(pathA);
	const parsedB = path.parse(pathB);

	const pathAWithoutExtension = path.join(parsedA.dir, parsedA.name);
	const pathBWithoutExtension = path.join(parsedB.dir, parsedB.name);

	// if paths without extension aren't equal then return false
	if (pathAWithoutExtension !== pathBWithoutExtension) return false;

	// as long as both paths have a .js or .ts extension we can be sure that they are equal
	if (validExtensions.includes(parsedA.ext) && validExtensions.includes(parsedB.ext)) return true;

	return false;
}

/** Searches around for the module
 *
 * @param path
 */
function searchForModule(
	modPath: string
): { path: string; prettyPath: string; type: 'file' | 'directory' } | undefined {
	if (fs.existsSync(modPath)) {
		return {
			path: modPath,
			prettyPath: modPath,
			type: fs.statSync(modPath).isDirectory() ? 'directory' : 'file',
		};
	}

	const containing = path.join(modPath, '../');

	// if containing folder doesn't exist this can't exist
	if (!fs.existsSync(containing)) return undefined;

	const modParsed = path.parse(modPath);

	// sometimes it will point to .js because it will resolve in prod but not for us
	if (modParsed.ext === '.js') {
		const newPath = `${modPath.slice(0, modPath.length - 3)}.ts`;

		if (fs.existsSync(newPath)) return { path: newPath, prettyPath: modPath, type: 'file' };
	}

	const files = fs.readdirSync(containing);

	for (const file of files) {
		const fileParsed = path.parse(file);

		// this way the extension doesn't matter
		if (fileParsed.name === modParsed.base) {
			const filePath = path.join(containing, file);

			// we remove the extension since it wasn't included by the user
			const prettyPath = filePath.slice(0, filePath.length - fileParsed.ext.length);

			return {
				path: filePath,
				prettyPath: prettyPath,
				type: fs.statSync(filePath).isDirectory() ? 'directory' : 'file',
			};
		}
	}

	return undefined;
}

/** Iterates over the dependency and resolves each one using the nearest package.json file.
 * Strips node APIs and pins the version of each dependency based on what is in the package.json.
 *
 * @param deps
 * @param filePath
 * @returns
 */
function resolveRemoteDeps(
	deps: string[],
	filePath: string,
	{ doNotInstall }: { doNotInstall: string[] } = {
		doNotInstall: [],
	}
) {
	const exemptDeps = new Set(doNotInstall);

	const pkgPath = findNearestPackageJson(path.dirname(filePath), '');

	const dependencies = new Set<string>();
	const devDependencies = new Set<string>();

	if (pkgPath) {
		const { devDependencies: packageDevDependencies, dependencies: packageDependencies } =
			JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

		for (const dep of deps) {
			const parsed = parsePackageName(dep);

			if (parsed.isErr()) {
				console.warn(
					`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped adding import \`${color.cyan(dep)}\`. Reason: Couldn't parse package name`
				);
				continue;
			}

			const depInfo = parsed.unwrap();

			if (!validatePackageName(depInfo.name).validForNewPackages) {
				console.warn(
					`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped adding import \`${color.cyan(dep)}\`. Reason: Not a valid package name`
				);
				continue;
			}

			if (exemptDeps.has(depInfo.name)) continue;

			let version: string | undefined = undefined;
			if (packageDependencies !== undefined) {
				version = packageDependencies[depInfo.name];
			}

			if (version !== undefined) {
				dependencies.add(`${depInfo.name}@${version}`);
				continue;
			}

			if (packageDevDependencies !== undefined) {
				version = packageDevDependencies[depInfo.name];
			}

			if (version !== undefined) {
				devDependencies.add(`${depInfo.name}@${version}`);
				continue;
			}

			// if no version found just add it without a version
			dependencies.add(depInfo.name);
		}
	}

	return {
		dependencies: Array.from(dependencies),
		devDependencies: Array.from(devDependencies),
	};
}

const languages: Lang[] = [css, html, json, jsonc, sass, svelte, svg, typescript, vue, yaml];

export {
	css,
	html,
	json,
	jsonc,
	sass,
	svelte,
	svg,
	typescript,
	vue,
	yaml,
	languages,
	resolutionEquality,
};
