import fs, { existsSync } from 'node:fs';
import type {
	RemoteDependency,
	RemoteDependencyResolver,
	RemoteDependencyResolverOptions,
} from 'jsrepo/config';
import { join } from 'pathe';
import { type ParsedState, parsePnpmState } from './catalog.js';

/**
 * Resolve `workspace:` and `catalog:` versions to concrete semver strings.
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import { pnpm } from "@jsrepo/pnpm";
 *
 * export default defineConfig({
 *   // ...
 *   build: {
 *     remoteDependencyResolver: pnpm(),
 *   },
 * });
 * ```
 */
export function pnpm(): RemoteDependencyResolver {
	return async (
		dep: RemoteDependency,
		options: RemoteDependencyResolverOptions
	): Promise<RemoteDependency> => {
		const version = dep.version;
		if (!version) return dep;

		const workspaceParsed = parseWorkspaceVersion(version);
		if (workspaceParsed) {
			const state = getOrParseState(options.cwd);

			if (workspaceParsed.type === 'path') {
				// workspace:../path - resolve from workspace root
				const resolvedVersion = resolveWorkspacePath(state, workspaceParsed.path);
				if (resolvedVersion) {
					return { ...dep, version: resolvedVersion };
				}
				throw new Error(
					`Could not resolve workspace path ${workspaceParsed.path} for ${dep.name}`
				);
			}

			// workspace:packageName@versionSpec or workspace:* (packageName from dep.name)
			const packageName = workspaceParsed.packageName || dep.name;
			const versionSpec = workspaceParsed.versionSpec;
			const workspaceVersion = state.workspacePackages.get(packageName);

			if (!workspaceVersion) {
				throw new Error(
					`Workspace package "${packageName}" not found. Available: ${[
						...state.workspacePackages.keys(),
					].join(', ')}`
				);
			}

			const resolvedVersion = resolveWorkspaceVersion(versionSpec, workspaceVersion);

			// workspace:foo@* means alias: dep.name is the alias, we output npm:foo@version
			if (workspaceParsed.packageName && workspaceParsed.packageName !== dep.name) {
				return {
					...dep,
					version: `npm:${packageName}@${resolvedVersion}`,
				};
			}

			return { ...dep, version: resolvedVersion };
		}

		const catalogParsed = parseCatalogVersion(version);
		if (catalogParsed) {
			const state = getOrParseState(options.cwd);

			let catalogMap: Map<string, string>;
			if (catalogParsed.catalogName === 'default') {
				catalogMap = state.catalogDefault;
			} else {
				const named = state.catalogsNamed.get(catalogParsed.catalogName);
				if (!named) {
					throw new Error(
						`Catalog "${catalogParsed.catalogName}" not found. Available: default, ${[
							...state.catalogsNamed.keys(),
						].join(', ')}`
					);
				}
				catalogMap = named;
			}

			const catalogVersion = catalogMap.get(dep.name);
			if (!catalogVersion) {
				throw new Error(
					`Package "${dep.name}" not found in catalog "${catalogParsed.catalogName}". Available: ${[
						...catalogMap.keys(),
					].join(', ')}`
				);
			}

			return { ...dep, version: catalogVersion };
		}

		return dep;
	};
}

const stateCache = new Map<string, ParsedState>();

function getOrParseState(cwd: string): ParsedState {
	let state = stateCache.get(cwd);
	if (!state) {
		state = parsePnpmState(cwd);
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
	// workspace:1.0.0 or similar - use literal
	return versionSpec;
}

/**
 * Parse workspace: protocol value. Returns { type, packageName?, versionSpec?, path? }
 */
function parseWorkspaceVersion(version: string):
	| {
			type: 'workspace';
			packageName: string;
			versionSpec: string;
	  }
	| {
			type: 'path';
			path: string;
	  }
	| null {
	if (!version.startsWith('workspace:')) return null;
	const rest = version.slice('workspace:'.length);

	// workspace:../foo or workspace:./packages/bar or workspace:packages/pkg-a (path with /)
	if (
		rest.startsWith('.') ||
		rest.startsWith('/') ||
		(rest.includes('/') && !rest.includes('@'))
	) {
		return { type: 'path', path: rest };
	}

	// workspace:foo@* or workspace:foo@^ etc - alias
	const atIdx = rest.lastIndexOf('@');
	if (atIdx > 0) {
		const packageName = rest.slice(0, atIdx);
		const versionSpec = rest.slice(atIdx + 1) || '*';
		return { type: 'workspace', packageName, versionSpec };
	}

	// workspace:* or workspace:^ or workspace:~ or workspace:1.0.0
	return { type: 'workspace', packageName: '', versionSpec: rest || '*' };
}

function parseCatalogVersion(version: string): { catalogName: string } | null {
	if (!version.startsWith('catalog:')) return null;
	const name = version.slice('catalog:'.length).trim();
	// catalog: or catalog:default -> default
	return { catalogName: name === '' ? 'default' : name };
}

function resolveWorkspacePath(state: ParsedState, pathSpec: string): string | null {
	const targetDir = join(state.workspaceRoot, pathSpec);
	const pkgPath = join(targetDir, 'package.json');
	if (!existsSync(pkgPath)) return null;
	try {
		const content = fs.readFileSync(pkgPath, 'utf-8');
		const pkg = JSON.parse(content) as { version?: string };
		return typeof pkg.version === 'string' ? pkg.version : null;
	} catch {
		return null;
	}
}
