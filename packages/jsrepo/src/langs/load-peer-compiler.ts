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
 * @throws {MissingPeerDependencyError} if the module can't be resolved from either location.
 */
export async function loadPeerCompiler<T>(
	specifier: string,
	{ cwd, packageName, feature }: LoadPeerCompilerOptions
): Promise<T> {
	// resolve relative to the user's project first
	try {
		const require = createRequire(pathToFileURL(joinAbsolute(cwd, 'package.json')));
		const resolved = require.resolve(specifier);
		return (await import(pathToFileURL(resolved).href)) as T;
	} catch {
		// fall back to resolving relative to jsrepo itself (local dev / hoisted installs)
		try {
			return (await import(specifier)) as T;
		} catch {
			throw new MissingPeerDependencyError(packageName, feature);
		}
	}
}
