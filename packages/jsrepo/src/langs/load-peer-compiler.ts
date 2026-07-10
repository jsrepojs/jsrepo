import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { MissingPeerDependencyError } from '@/utils/errors';
import { joinAbsolute } from '@/utils/path';
import type { AbsolutePath } from '@/utils/types';

export type LoadPeerCompilerOptions = {
	/** The directory to resolve the module from (i.e. the consumer's project root). */
	cwd: AbsolutePath;
	/** The package name to report if the module can't be resolved. */
	packageName: string;
	/** The human readable feature name to report if the module can't be resolved. */
	feature: string;
};

/**
 * Normalizes ESM default interop for a dynamically imported module.
 *
 * @remarks
 * Only used for the ESM fallback path. When a CommonJS module is reached via
 * `import()`, Node exposes its `module.exports` under `default`; unwrap it so
 * callers get the real API regardless of how the exports lexer analyzed the file.
 */
function interopDefault<T>(mod: Record<string, unknown>): T {
	if (
		mod?.default != null &&
		(typeof mod.default === 'object' || typeof mod.default === 'function')
	) {
		return mod.default as T;
	}
	return mod as T;
}

/**
 * Loads a peer compiler module (e.g. `svelte/compiler`) by resolving it from the
 * consumer's project directory (`cwd`) first, then falling back to jsrepo's own
 * resolution.
 *
 * @remarks
 * A plain `await import(specifier)` resolves the module relative to jsrepo's own
 * location on disk rather than the user's project. When jsrepo is installed in a
 * different `node_modules` than the framework (a global/`npx` install, a hoisted
 * monorepo, or a package manager that doesn't hoist peer deps), that lookup fails
 * even though the user *did* install the dependency in their project. Resolving
 * from `cwd` first ensures we find the copy the user actually installed.
 *
 * `svelte/compiler` and `vue/compiler-sfc` ship as CommonJS, so we load them with
 * `require()` — which returns `module.exports` directly with the real API on it.
 * This avoids the ESM-interop ambiguity (exports ending up under `default`) that
 * varies between Node versions when a CJS file is reached via `import()`. Modules
 * that are ESM-only fall back to a dynamic `import()`.
 *
 * @throws {MissingPeerDependencyError} if the module can't be resolved from either location.
 */
export async function loadPeerCompiler<T>(
	specifier: string,
	{ cwd, packageName, feature }: LoadPeerCompilerOptions
): Promise<T> {
	// resolve from the user's project first, then jsrepo's own location
	const bases = [pathToFileURL(joinAbsolute(cwd, 'package.json')).href, import.meta.url];

	for (const base of bases) {
		const require = createRequire(base);

		let resolved: string;
		try {
			resolved = require.resolve(specifier);
		} catch {
			// not resolvable from this base, try the next one
			continue;
		}

		try {
			// CJS: returns module.exports with the real API, no interop ambiguity
			return require(specifier) as T;
		} catch (error) {
			// ESM-only module: require() throws, fall back to a dynamic import
			if ((error as NodeJS.ErrnoException)?.code === 'ERR_REQUIRE_ESM') {
				return interopDefault<T>(await import(pathToFileURL(resolved).href));
			}
			throw error;
		}
	}

	throw new MissingPeerDependencyError(packageName, feature);
}
