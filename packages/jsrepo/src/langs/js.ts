import fs from 'node:fs';
import { builtinModules } from 'node:module';
import escapeStringRegexp from 'escape-string-regexp';
import { err, ok, type Result } from 'nevereverthrow';
import { parseAsync } from 'oxc-parser';
import { detect, resolveCommand } from 'package-manager-detector';
import path from 'pathe';
import pc from 'picocolors';
import type {
	ImportTransform,
	InstallDependenciesOptions,
	Language,
	ResolveDependenciesOptions,
	TransformImportsOptions,
} from '@/langs/types';
import type {
	LocalDependency,
	RemoteDependency,
	ResolvedFile,
	UnresolvedImport,
} from '@/utils/build';
import { findNearestPackageJson, shouldInstall } from '@/utils/package';
import { parsePackageName } from '@/utils/parse-package-name';
import { runCommands } from '@/utils/prompts';
import { createPathsMatcher, tryGetTsconfig } from '@/utils/tsconfig';
import { validateNpmPackageName } from '@/utils/validate-npm-package-name';

const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.mts'] as const;

// biome-ignore lint/complexity/noBannedTypes: leave me alone for a minute
export type JsOptions = {};

/**
 * Despite the name this is for javascript and typescript.
 */
export function js(_options: JsOptions = {}): Language {
	return {
		name: 'javascript',
		canResolveDependencies: (fileName) =>
			SUPPORTED_EXTENSIONS.some((ext) => fileName.endsWith(ext)),
		resolveDependencies: async (code, opts) =>
			resolveImports(await getImports(code, opts.fileName), opts),
		transformImports: async (imports, opts) =>
			transformImports(imports as (UnresolvedImport & ImportTemplate)[], opts),
		canInstallDependencies: (ecosystem) => ecosystem === 'js',
		installDependencies: async (deps, opts) => installDependencies(deps, opts),
	};
}

/** The template that will be used to resolve the import on the client */
export type ImportTemplate = { filePathRelativeToItem: string };

/**
 * Resolves dependencies for javascript and typescript.
 * @param code
 * @param opts
 */
export async function resolveImports(
	imports: string[],
	opts: ResolveDependenciesOptions
): Promise<{
	localDependencies: LocalDependency[];
	dependencies: RemoteDependency[];
	devDependencies: RemoteDependency[];
}> {
	const localDeps: LocalDependency[] = [];
	const remoteDeps: RemoteDependency[] = [];

	for (const specifier of imports) {
		// don't resolve node builtins or node: imports
		if (builtinModules.includes(specifier) || specifier.startsWith('node:')) continue;

		if (specifier.startsWith('.')) {
			const actualPath = path.resolve(opts.cwd, path.dirname(opts.fileName), specifier);

			const mod = searchForModule(actualPath);
			if (mod === undefined) continue;

			localDeps.push({
				fileName: mod.path,
				import: specifier,
				createTemplate: (resolvedDependency) =>
					createImportTemplate(resolvedDependency, { import: specifier, cwd: opts.cwd }),
			});
			continue;
		}

		// if specifier wasn't a local dependency then it might be a path alias
		const localDep = tryResolveLocalAlias(specifier, {
			fileName: opts.fileName,
			cwd: opts.cwd,
		});

		if (!localDep.isErr() && localDep.value !== null) {
			const dep = localDep.value;

			if (dep) {
				localDeps.push(dep);
				continue;
			}
		}

		// check if the specifier is a package
		const parsed = parsePackageName(specifier);

		if (!parsed.isErr()) {
			const depInfo = parsed.value;

			if (validateNpmPackageName(depInfo.name).validForNewPackages) {
				if (opts.excludeDeps.includes(depInfo.name)) continue;

				remoteDeps.push({
					ecosystem: 'js',
					name: depInfo.name,
					version: depInfo.version,
				});
				continue;
			}
		}

		opts.warn(
			`Skipped adding import \`${pc.cyan(specifier)}\` from ${
				opts.fileName
			}. Reason: Not a valid package name or path alias.`
		);
	}

	const { dependencies, devDependencies } = resolveRemoteDeps(remoteDeps, opts.fileName);

	return {
		localDependencies: localDeps,
		dependencies,
		devDependencies,
	};
}

function createImportTemplate(
	resolvedFile: ResolvedFile,
	{ cwd }: { import: string; cwd: string }
): ImportTemplate {
	return {
		filePathRelativeToItem: path.relative(
			path.join(cwd, resolvedFile.parent.basePath),
			path.join(cwd, resolvedFile.path)
		),
	};
}

export async function getImports(code: string, fileName: string): Promise<string[]> {
	const result = await parseAsync(fileName, code);

	const modules: string[] = [];

	// handle static imports
	for (const imp of result.module.staticImports) {
		modules.push(imp.moduleRequest.value);
	}

	// handle dynamic imports
	for (const imp of result.module.dynamicImports) {
		// trims the codes and gets the module
		const mod = code.slice(imp.moduleRequest.start + 1, imp.moduleRequest.end - 1);

		modules.push(mod);
	}

	// handle `export x from y` syntax
	for (const exp of result.module.staticExports) {
		for (const entry of exp.entries) {
			if (entry.moduleRequest) {
				modules.push(entry.moduleRequest.value);
			}
		}
	}

	return modules;
}

/** Searches around for the module
 *
 * @param path
 */
function searchForModule(
	modPath: string
): { path: string; prettyPath: string; type: 'file' | 'directory' } | undefined {
	if (fs.existsSync(modPath)) {
		const isIndex = fs.statSync(modPath).isDirectory();

		if (!isIndex) {
			return {
				path: modPath,
				prettyPath: modPath,
				type: 'file',
			};
		}

		const indexPath = searchForModule(path.join(modPath, 'index.js'));

		if (indexPath === undefined) return undefined;

		return {
			path: indexPath.path,
			prettyPath: modPath,
			type: isIndex ? 'directory' : 'file',
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

/** Tries to resolve the modules as an alias using the tsconfig. */
function tryResolveLocalAlias(
	mod: string,
	{ fileName, cwd }: { fileName: string; cwd: string }
): Result<LocalDependency | null, string> {
	const configResult = tryGetTsconfig(path.join(cwd, fileName));

	if (configResult.isErr()) return err(configResult.error);

	const config = configResult.value;

	if (config === null) return ok(null);

	const matcher = createPathsMatcher(config, { cwd });

	if (matcher) {
		// if the mod is actually remote the returns paths will be empty
		const paths = matcher(mod);

		for (const modPath of paths) {
			const foundMod = searchForModule(modPath);
			if (!foundMod) continue;
			return ok({
				fileName: foundMod.path,
				import: mod,
				createTemplate: (resolvedDependency) =>
					createImportTemplate(resolvedDependency, { import: mod, cwd }),
			});
		}
	}

	return ok(null);
}

/** Iterates over the dependency and resolves each one using the nearest package.json file.
 * Strips node APIs and pins the version of each dependency based on what is in the package.json.
 *
 * @param deps
 * @param filePath
 * @returns
 */
function resolveRemoteDeps(
	deps: RemoteDependency[],
	filePath: string
): { dependencies: RemoteDependency[]; devDependencies: RemoteDependency[] } {
	if (deps.length === 0) return { dependencies: [], devDependencies: [] };

	const dependencies: RemoteDependency[] = [];
	const devDependencies: RemoteDependency[] = [];

	const packageResult = findNearestPackageJson(path.dirname(filePath));

	if (packageResult) {
		const { devDependencies: packageDevDependencies, dependencies: packageDependencies } =
			packageResult.package;

		for (const dep of deps) {
			const resolved = dependencies.filter((d) => d.name === dep.name);
			if (resolved.length > 0) {
				if (dep.version === undefined) continue;

				// we have already resolved the manually specified version
				if (resolved.find((d) => d.version === dep.version)) continue;
			}

			let version: string | undefined;
			if (packageDependencies !== undefined) {
				version = packageDependencies[dep.name];
				if (version !== undefined) {
					dependencies.push({ ...dep, version });
					continue;
				}
			}

			if (packageDevDependencies !== undefined) {
				version = packageDevDependencies[dep.name];
				if (version !== undefined) {
					devDependencies.push({ ...dep, version });
					continue;
				}
			}

			dependencies.push({ ...dep });
		}
	}

	return { dependencies, devDependencies };
}

export async function transformImports(
	imports: UnresolvedImport[],
	opts: TransformImportsOptions
): Promise<ImportTransform[]> {
	const destDir = path.join(opts.targetPath);

	const transformedImports: ImportTransform[] = [];

	for (const imp of imports) {
		const itemPath = opts.getItemPath(imp.item);
		if (!itemPath) continue;
		const filePathRelativeToItem = imp.meta.filePathRelativeToItem as string | undefined;
		if (!filePathRelativeToItem) continue;

		const originalParsed = path.parse(imp.import);
		const filePathRelativeToItemParsed = path.parse(filePathRelativeToItem);

		// this way we maintain the same extension as the original import whether it's .js, .ts or nothing
		const filePathRelativeToItemWithExtension = `${filePathRelativeToItem.slice(
			0,
			-filePathRelativeToItemParsed.ext.length
		)}${originalParsed.ext}`;

		// if relative make it relative
		if (itemPath.alias === undefined) {
			const relative = path.relative(
				path.dirname(destDir),
				path.join(opts.cwd, itemPath.path, filePathRelativeToItemWithExtension)
			);

			transformedImports.push({
				pattern: createImportPattern(imp.import),
				replacement: createReplacement(
					relative.startsWith('.') ? relative : `./${relative}`
				),
			});
			continue;
		}

		transformedImports.push({
			pattern: createImportPattern(imp.import),
			replacement: createReplacement(
				path.join(itemPath.alias, filePathRelativeToItemWithExtension)
			),
		});
	}

	return transformedImports;
}

function createImportPattern(literal: string): RegExp {
	// eventually we can use RegExp.escape I assume as soon as polyfills are available
	return new RegExp(`(['"])${escapeStringRegexp(literal)}\\1`, 'g');
}

function createReplacement(replacement: string): string {
	return `$1${replacement}$1`;
}

export async function installDependencies(
	dependencies: { dependencies: RemoteDependency[]; devDependencies: RemoteDependency[] },
	{ cwd }: InstallDependenciesOptions
): Promise<void> {
	const packageResult = findNearestPackageJson(cwd);
	if (!packageResult) return;
	const pm = (await detect({ cwd }))?.agent ?? 'npm';

	// this is only if no dependencies were provided
	if (dependencies.dependencies.length === 0 && dependencies.devDependencies.length === 0) {
		const installCmd = resolveCommand(pm, 'install', []);

		if (installCmd === null) return;

		await runCommands({
			title: `Installing dependencies with ${pm}...`,
			commands: [installCmd],
			cwd,
			messages: {
				success: () => `Installed dependencies`,
				error: (err) =>
					`Failed to install dependencies: ${err instanceof Error ? err.message : err}`,
			},
		});
		return;
	}

	const { dependencies: deps, devDependencies: devDeps } = shouldInstall(dependencies, {
		pkg: packageResult.package,
	});

	if (deps.length === 0 && devDeps.length === 0) return;

	const add = resolveCommand(pm, 'add', [
		...deps.map((d) => `${d.name}${d.version ? `@${d.version}` : ''}`),
	]);
	const addDev = resolveCommand(pm, 'add', [
		'-D',
		...devDeps.map((d) => `${d.name}${d.version ? `@${d.version}` : ''}`),
	]);

	await runCommands({
		title: `Installing dependencies with ${pm}...`,
		commands: [
			...(add && deps.length > 0 ? [add] : []),
			...(addDev && devDeps.length > 0 ? [addDev] : []),
		],
		cwd,
		messages: {
			success: () =>
				`Installed ${pc.cyan(deps.map((d) => `${d.name}${d.version ? `@${d.version}` : ''}`).join(', '))}`,
			error: (err) =>
				`Failed to install dependencies: ${err instanceof Error ? err.message : err}`,
		},
	});
}
