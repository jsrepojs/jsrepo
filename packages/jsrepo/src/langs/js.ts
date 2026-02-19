import { builtinModules } from 'node:module';
import escapeStringRegexp from 'escape-string-regexp';
import { err, ok, Result } from 'nevereverthrow';
import { parse } from 'oxc-parser';
import { resolveCommand } from 'package-manager-detector';
import path from 'pathe';
import pc from 'picocolors';
import { ModuleNotFoundError } from '@/api';
import type {
	ImportTransform,
	InstallDependenciesOptions,
	Language,
	ResolveDependenciesOptions,
	TransformImportsOptions,
} from '@/langs/types';
import type { LocalDependency, RemoteDependency, UnresolvedImport } from '@/utils/build';
import { transformShadcnImports } from '@/utils/compat/shadcn';
import { existsSync, readdirSync, statSync } from '@/utils/fs';
import { findNearestPackageJson, shouldInstall } from '@/utils/package';
import { parsePackageName } from '@/utils/parse-package-name';
import { dirname, joinAbsolute } from '@/utils/path';
import { detectPackageManager, runCommands } from '@/utils/prompts';
import { createPathsMatcher, tryGetTsconfig } from '@/utils/tsconfig';
import type { AbsolutePath } from '@/utils/types';
import { noop } from '@/utils/utils';
import { validateNpmPackageName } from '@/utils/validate-npm-package-name';
import { InvalidImportWarning, UnresolvableDynamicImportWarning } from '@/utils/warnings';

const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.mts'] as const;
const SUPPORTED_PACKAGE_IMPORT_CONDITIONS = new Set(['default', 'import', 'node']);

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
			resolveImports(await getImports(code, opts), opts),
		transformImports,
		canInstallDependencies: (ecosystem) => ecosystem === 'js',
		installDependencies,
	};
}

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
			const actualPath = joinAbsolute(dirname(opts.fileName), specifier);

			const mod = searchForModule(actualPath);
			if (mod === undefined) continue;

			localDeps.push({
				fileName: mod.path,
				import: specifier,
				createTemplate: () => ({}),
			});
			continue;
		}

		// if specifier wasn't a local dependency then it might be a path alias or subpath import
		const resolvedAlias = tryResolveAliasImport(specifier, {
			fileName: opts.fileName,
			cwd: opts.cwd,
		});

		if (resolvedAlias.isOk() && resolvedAlias.value?.localDependency) {
			localDeps.push(resolvedAlias.value.localDependency);
			continue;
		}

		const parsedSpecifier =
			resolvedAlias.isOk() && resolvedAlias.value?.remoteSpecifier
				? resolvedAlias.value.remoteSpecifier
				: specifier;
		const parsed = parsePackageName(parsedSpecifier);

		// if the specifier is not a valid package either then we know it's unresolvable and we throw an error
		if (parsed.isErr() && resolvedAlias.isErr()) {
			throw new ModuleNotFoundError(specifier, { fileName: opts.fileName });
		}

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

		opts.warn(new InvalidImportWarning({ specifier, fileName: opts.fileName }));
	}

	const { dependencies, devDependencies } = resolveRemoteDeps(
		remoteDeps,
		joinAbsolute(opts.cwd, opts.fileName)
	);

	return {
		localDependencies: localDeps,
		dependencies,
		devDependencies,
	};
}

export async function getImports(
	code: string,
	{
		fileName,
		warn,
	}: {
		fileName: ResolveDependenciesOptions['fileName'];
		warn: ResolveDependenciesOptions['warn'];
	}
): Promise<string[]> {
	const result = await parse(fileName, code);

	const modules = new Set<string>();

	// handle static imports
	for (const imp of result.module.staticImports) {
		modules.add(imp.moduleRequest.value);
	}

	// handle dynamic imports
	for (const imp of result.module.dynamicImports) {
		const fullImport = code.slice(imp.moduleRequest.start, imp.moduleRequest.end);
		const parsedImport = await parse(fileName, fullImport);

		// an literal expression or a template literal with a single quasi
		const isLiteral =
			parsedImport.program.body[0]?.type === 'ExpressionStatement' &&
			(parsedImport.program.body[0].expression.type === 'Literal' ||
				(parsedImport.program.body[0].expression.type === 'TemplateLiteral' &&
					parsedImport.program.body[0].expression.quasis.length === 1));

		// we can't resolve dynamic imports that are not literals so we just skip them and warn the user
		if (!isLiteral) {
			warn(new UnresolvableDynamicImportWarning({ specifier: fullImport, fileName }));
			continue;
		}

		// trim quotes from the start and end
		modules.add(code.slice(imp.moduleRequest.start + 1, imp.moduleRequest.end - 1));
	}

	// handle `export x from y` syntax
	for (const exp of result.module.staticExports) {
		for (const entry of exp.entries) {
			if (entry.moduleRequest) {
				modules.add(entry.moduleRequest.value);
			}
		}
	}

	return Array.from(modules);
}

/** Searches around for the module
 *
 * @param path
 */
function searchForModule(
	modPath: AbsolutePath,
	{ allowExtensionlessFallback = true }: { allowExtensionlessFallback?: boolean } = {}
): { path: AbsolutePath; prettyPath: string; type: 'file' | 'directory' } | undefined {
	if (existsSync(modPath)) {
		// if it's already pointing to a file then return it
		if (!statSync(modPath)._unsafeUnwrap().isDirectory()) {
			return {
				path: modPath,
				prettyPath: modPath,
				type: 'file',
			};
		}

		const indexPath = searchForModule(joinAbsolute(modPath, 'index.js'));

		if (indexPath !== undefined) {
			return {
				path: indexPath.path,
				prettyPath: modPath,
				type: 'file',
			};
		}

		// it's also possible to reference a file without providing the extension

		const filePath = searchForModule(`${modPath}.js` as AbsolutePath);

		if (filePath === undefined) return undefined;

		return {
			path: filePath.path,
			prettyPath: modPath,
			type: 'file',
		};
	}

	const containing = joinAbsolute(modPath, '../');

	// if containing folder doesn't exist this can't exist
	if (!existsSync(containing)) return undefined;

	const modParsed = path.parse(modPath);

	// sometimes it will point to .js because it will resolve in prod but not for us
	if (modParsed.ext === '.js') {
		const newPath = `${modPath.slice(0, modPath.length - 3)}.ts` as AbsolutePath;

		if (existsSync(newPath)) return { path: newPath, prettyPath: modPath, type: 'file' };
	}

	if (!allowExtensionlessFallback) return undefined;

	const filesResult = readdirSync(containing);
	if (filesResult.isErr()) return undefined;
	const files = filesResult.value;

	for (const file of files) {
		const fileParsed = path.parse(file);

		// this way the extension doesn't matter
		if (fileParsed.name === modParsed.base) {
			const filePath = joinAbsolute(containing, file);
			const fileStats = statSync(filePath);
			if (fileStats.isErr()) continue;
			const isDirectory = fileStats.value.isDirectory();

			// we remove the extension since it wasn't included by the user
			const prettyPath = filePath.slice(0, filePath.length - fileParsed.ext.length);

			return {
				path: filePath,
				prettyPath: prettyPath,
				type: isDirectory ? 'directory' : 'file',
			};
		}
	}

	return undefined;
}

type AliasResolution =
	| {
			localDependency: LocalDependency;
			remoteSpecifier?: never;
	  }
	| {
			remoteSpecifier: string;
			localDependency?: never;
	  };

/** Tries to resolve the modules as an alias using tsconfig or package.json imports. */
function tryResolveAliasImport(
	mod: string,
	{ fileName, cwd }: { fileName: string; cwd: AbsolutePath }
): Result<AliasResolution | null, string> {
	const tsconfigAlias = tryResolveTsconfigAlias(mod, { fileName, cwd });

	if (tsconfigAlias.isErr()) return err(tsconfigAlias.error);

	if (tsconfigAlias.value !== null) {
		return ok({ localDependency: tsconfigAlias.value });
	}

	if (!mod.startsWith('#')) return ok(null);

	return tryResolvePackageImportsAlias(mod, { fileName, cwd });
}

/** Tries to resolve the modules as an alias using the tsconfig. */
function tryResolveTsconfigAlias(
	mod: string,
	{ fileName, cwd }: { fileName: string; cwd: AbsolutePath }
): Result<LocalDependency | null, string> {
	const configResult = tryGetTsconfig(joinAbsolute(cwd, fileName));

	if (configResult.isErr()) return ok(null);

	const config = configResult.value;

	if (config === null) return ok(null);

	const matcher = createPathsMatcher(config, { cwd });
	const hasMatchingPathAlias = hasMatchingTsconfigPathAlias(
		mod,
		config.config.compilerOptions?.paths
	);
	const allowExtensionlessFallback =
		!isPotentiallyRemotePackageSpecifier(mod) || hasMatchingPathAlias;

	if (matcher) {
		// if the mod is actually remote the returns paths will be empty
		const paths = matcher(mod);

		if (paths.length === 0) return ok(null);

		for (const modPath of paths) {
			const foundMod = searchForModule(modPath as AbsolutePath, {
				allowExtensionlessFallback,
			});
			if (!foundMod) continue;
			return ok({
				fileName: foundMod.path,
				import: mod,
				createTemplate: () => ({}),
			});
		}

		return err('Module not found');
	}

	return ok(null);
}

function tryResolvePackageImportsAlias(
	mod: string,
	{ fileName, cwd }: { fileName: string; cwd: AbsolutePath }
): Result<AliasResolution | null, string> {
	const nearestPackage = findNearestPackageJson(dirname(joinAbsolute(cwd, fileName)));
	if (!nearestPackage) return ok(null);

	const imports = nearestPackage.package.imports;
	if (!isRecord(imports)) return ok(null);

	const matchedImport = getMatchingPackageImport(mod, imports);
	if (!matchedImport) return ok(null);

	const resolvedTargets = resolvePackageImportTargets(
		matchedImport.target,
		matchedImport.wildcardMatch
	);
	if (resolvedTargets.length === 0) return err('Module not found');

	const packageRoot = dirname(nearestPackage.path);

	for (const target of resolvedTargets) {
		if (target.startsWith('.')) {
			const foundMod = searchForModule(joinAbsolute(packageRoot, target));
			if (!foundMod) continue;

			return ok({
				localDependency: {
					fileName: foundMod.path,
					import: mod,
					createTemplate: () => ({}),
				},
			});
		}

		// package imports can also map to external npm packages
		if (parsePackageName(target).isOk()) {
			return ok({ remoteSpecifier: target });
		}
	}

	return err('Module not found');
}

function getMatchingPackageImport(
	specifier: string,
	imports: Record<string, unknown>
): { target: unknown; wildcardMatch?: string } | null {
	if (Object.hasOwn(imports, specifier)) {
		return { target: imports[specifier] };
	}

	const patternMatches: Array<{
		target: unknown;
		wildcardMatch: string;
		prefixLength: number;
		suffixLength: number;
	}> = [];

	for (const [key, target] of Object.entries(imports)) {
		const wildcardIndex = key.indexOf('*');
		if (wildcardIndex === -1) continue;

		const prefix = key.slice(0, wildcardIndex);
		const suffix = key.slice(wildcardIndex + 1);

		if (!specifier.startsWith(prefix)) continue;
		if (!specifier.endsWith(suffix)) continue;

		patternMatches.push({
			target,
			wildcardMatch: specifier.slice(prefix.length, specifier.length - suffix.length),
			prefixLength: prefix.length,
			suffixLength: suffix.length,
		});
	}

	if (patternMatches.length === 0) return null;

	patternMatches.sort((a, b) => {
		if (a.prefixLength !== b.prefixLength) return b.prefixLength - a.prefixLength;
		return b.suffixLength - a.suffixLength;
	});

	const bestMatch = patternMatches[0];
	if (!bestMatch) return null;

	return {
		target: bestMatch.target,
		wildcardMatch: bestMatch.wildcardMatch,
	};
}

function resolvePackageImportTargets(target: unknown, wildcardMatch?: string): string[] {
	if (typeof target === 'string') {
		if (wildcardMatch === undefined) return [target];
		return [target.replaceAll('*', wildcardMatch)];
	}

	if (Array.isArray(target)) {
		return target.flatMap((entry) => resolvePackageImportTargets(entry, wildcardMatch));
	}

	if (isRecord(target)) {
		const resolvedTargets: string[] = [];

		for (const [condition, value] of Object.entries(target)) {
			if (!SUPPORTED_PACKAGE_IMPORT_CONDITIONS.has(condition)) continue;
			resolvedTargets.push(...resolvePackageImportTargets(value, wildcardMatch));
		}

		return resolvedTargets;
	}

	return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPotentiallyRemotePackageSpecifier(specifier: string): boolean {
	if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('#')) {
		return false;
	}

	// Ignore url-style imports and protocol imports (e.g. node:, https:, npm:)
	if (specifier.includes(':')) return false;

	return parsePackageName(specifier).isOk();
}

function hasMatchingTsconfigPathAlias(
	specifier: string,
	paths: Record<string, readonly string[]> | undefined
): boolean {
	if (!paths) return false;

	for (const pattern of Object.keys(paths)) {
		const wildcardIndex = pattern.indexOf('*');

		if (wildcardIndex === -1) {
			if (pattern === specifier) return true;
			continue;
		}

		const prefix = pattern.slice(0, wildcardIndex);
		const suffix = pattern.slice(wildcardIndex + 1);
		if (specifier.startsWith(prefix) && specifier.endsWith(suffix)) return true;
	}

	return false;
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
	filePath: AbsolutePath
): { dependencies: RemoteDependency[]; devDependencies: RemoteDependency[] } {
	if (deps.length === 0) return { dependencies: [], devDependencies: [] };

	const dependencies: RemoteDependency[] = [];
	const devDependencies: RemoteDependency[] = [];

	const packageResult = findNearestPackageJson(dirname(filePath));

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
	code: string,
	_imports_: UnresolvedImport[],
	opts: TransformImportsOptions
): Promise<string> {
	const fileImports = await getImports(code, {
		fileName: joinAbsolute(opts.cwd, opts.targetPath),
		warn: noop,
	});

	const destDir = path.join(
		opts.getItemPath({ item: opts.item, file: opts.file }).path,
		opts.targetPath
	);

	const transformedImports: ImportTransform[] = [];

	for (const imp of _imports_) {
		const importIndex = fileImports.indexOf(imp.import);
		if (importIndex !== -1) {
			fileImports.splice(importIndex, 1);
		}
		const itemPath = opts.getItemPath({ item: imp.item, file: imp.file });
		if (!itemPath) continue;

		const { dir: filePathRelativeToItemDir, name: filePathRelativeToItemName } = path.parse(
			imp.file.path
		);
		const importExt = path.parse(imp.import).ext;

		// this handles the case where the import is referencing an index file but by the directory name instead of the index file itself
		// for example: './utils/math' instead of './utils/math/index.ts'
		let baseName =
			filePathRelativeToItemName === 'index' && path.parse(imp.import).name !== 'index'
				? ''
				: filePathRelativeToItemName;

		// Preserve the original import's extension if the file name doesn't already include it
		if (baseName && importExt && !baseName.endsWith(importExt)) {
			baseName += importExt;
		}

		// if relative make it relative
		if (itemPath.alias === undefined) {
			const relative = path.relative(
				path.join(opts.cwd, path.dirname(destDir)),
				path.join(opts.cwd, itemPath.path, filePathRelativeToItemDir, baseName)
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
				path.join(itemPath.alias, filePathRelativeToItemDir, baseName)
			),
		});
	}

	const componentsPaths = Result.fromThrowable(
		() => opts.getItemPath({ item: '', file: { type: 'component' } }),
		() => null
	)().unwrapOr(null);
	const utilsPaths = Result.fromThrowable(
		() => opts.getItemPath({ item: '', file: { type: 'util' } }),
		() => null
	)().unwrapOr(null);
	const uiPaths = Result.fromThrowable(
		() => opts.getItemPath({ item: '', file: { type: 'ui' } }),
		() => null
	)().unwrapOr(null);
	const libPaths = Result.fromThrowable(
		() => opts.getItemPath({ item: '', file: { type: 'lib' } }),
		() => null
	)().unwrapOr(null);
	const hooksPaths = Result.fromThrowable(
		() => opts.getItemPath({ item: '', file: { type: 'hook' } }),
		() => null
	)().unwrapOr(null);

	// any unresolved imports we can attempt to resolve with the shadcn compat transform
	code = await transformShadcnImports({
		code,
		imports: fileImports,
		config: {
			aliases: {
				components: componentsPaths?.alias ?? componentsPaths?.path,
				utils: utilsPaths?.alias ?? utilsPaths?.path,
				ui: uiPaths?.alias ?? uiPaths?.path,
				lib: libPaths?.alias ?? libPaths?.path,
				hooks: hooksPaths?.alias ?? hooksPaths?.path,
			},
		},
		fileName: joinAbsolute(opts.cwd, opts.targetPath),
	});

	for (const transformation of transformedImports) {
		code = code.replace(transformation.pattern, transformation.replacement);
	}

	return code;
}

export function createImportPattern(literal: string): RegExp {
	// eventually we can use RegExp.escape I assume as soon as polyfills are available
	return new RegExp(`(['"])${escapeStringRegexp(literal)}\\1`, 'g');
}

export function createReplacement(replacement: string): string {
	return `$1${replacement}$1`;
}

export async function installDependencies(
	dependencies: { dependencies: RemoteDependency[]; devDependencies: RemoteDependency[] },
	{ cwd }: InstallDependenciesOptions
): Promise<void> {
	const packageResult = findNearestPackageJson(cwd);
	if (!packageResult) return;
	const pm = await detectPackageManager(cwd);

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
				`Installed ${pc.cyan(
					[...deps, ...devDeps]
						.map((d) => `${d.name}${d.version ? `@${d.version}` : ''}`)
						.join(', ')
				)}`,
			error: (err) =>
				`Failed to install dependencies: ${err instanceof Error ? err.message : err}`,
		},
	});
}
