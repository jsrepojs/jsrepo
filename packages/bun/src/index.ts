import type {
	RemoteDependency,
	RemoteDependencyResolver,
	RemoteDependencyResolverOptions,
} from 'jsrepo/config';
import {
	buildWorkspacePackageMap,
	findBunWorkspaceRoot,
	getWorkspacePatterns,
} from './workspace.js';

/**
 * Resolve `workspace:` and `catalog:` versions to concrete semver strings.
 * 
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import { bun } from "@jsrepo/bun";
 * 
 * export default defineConfig({
 *   // ...
 *   build: {
 *     remoteDependencyResolver: bun(),
 *   },
 * });
 * ```
 */
export function bun(): RemoteDependencyResolver {
	return async (
		dep: RemoteDependency,
		options: RemoteDependencyResolverOptions
	): Promise<RemoteDependency> => {
		const version = dep.version;
		if (!version) return dep;

		const versionSpec = parseWorkspaceVersion(version);
		if (versionSpec === null) return dep;

		const state = getOrParseState(options.cwd);
		const workspaceVersion = state.workspacePackages.get(dep.name);

		if (!workspaceVersion) {
			throw new Error(
				`Workspace package "${dep.name}" not found. Available: ${[
					...state.workspacePackages.keys(),
				].join(', ')}`
			);
		}

		const resolvedVersion = resolveWorkspaceVersion(versionSpec, workspaceVersion);
		return { ...dep, version: resolvedVersion };
	};
}

type BunWorkspaceState = {
	workspacePackages: Map<string, string>;
};

const stateCache = new Map<string, BunWorkspaceState>();

function getOrParseState(cwd: string): BunWorkspaceState {
	let state = stateCache.get(cwd);
	if (!state) {
		const workspaceRoot = findBunWorkspaceRoot(cwd);
		if (!workspaceRoot) {
			throw new Error(
				`Could not find package.json with workspaces by walking up from ${cwd}`
			);
		}
		const patterns = getWorkspacePatterns(workspaceRoot);
		const workspacePackages = buildWorkspacePackageMap(workspaceRoot, patterns);
		state = { workspacePackages };
		stateCache.set(cwd, state);
	}
	return state;
}

function resolveWorkspaceVersion(versionSpec: string, workspaceVersion: string): string {
	if (versionSpec === '*' || versionSpec === '' || !versionSpec) {
		return workspaceVersion;
	}
	if (versionSpec === '^') {
		return `^${workspaceVersion}`;
	}
	if (versionSpec === '~') {
		return `~${workspaceVersion}`;
	}
	// workspace:1.0.0 - use literal
	return versionSpec;
}

/**
 * Parse workspace: protocol value. Returns versionSpec or null if not workspace.
 */
function parseWorkspaceVersion(version: string): string | null {
	if (!version.startsWith('workspace:')) return null;
	return version.slice('workspace:'.length) || '*';
}
