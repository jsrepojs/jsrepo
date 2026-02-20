import fs, { existsSync } from 'node:fs';
import { join } from 'pathe';
import { parse as parseYaml } from 'yaml';
import { buildWorkspacePackageMap, findPnpmWorkspaceRoot } from './workspace.js';

export type PnpmWorkspaceConfig = {
	packages?: string[];
	catalog?: Record<string, string>;
	catalogs?: Record<string, Record<string, string>>;
};

export type ParsedState = {
	workspaceRoot: string;
	workspacePackages: Map<string, string>;
	catalogDefault: Map<string, string>;
	catalogsNamed: Map<string, Map<string, string>>;
};

/**
 * Parse pnpm-workspace.yaml and return packages array, catalog, and catalogs.
 */
export function parsePnpmWorkspaceYaml(workspaceRoot: string): PnpmWorkspaceConfig {
	const filePath = join(workspaceRoot, 'pnpm-workspace.yaml');
	if (!existsSync(filePath)) {
		throw new Error(`pnpm-workspace.yaml not found at ${filePath}`);
	}
	const content = fs.readFileSync(filePath, 'utf-8');
	const parsed = parseYaml(content) as PnpmWorkspaceConfig;
	return parsed ?? {};
}

/**
 * Build catalog lookup: default catalog (catalog:) and named catalogs (catalog:name).
 */
function buildCatalogMaps(config: PnpmWorkspaceConfig): {
	catalogDefault: Map<string, string>;
	catalogsNamed: Map<string, Map<string, string>>;
} {
	const catalogDefault = new Map<string, string>();
	const catalogsNamed = new Map<string, Map<string, string>>();

	if (config.catalog && typeof config.catalog === 'object') {
		for (const [name, version] of Object.entries(config.catalog)) {
			if (typeof version === 'string') {
				catalogDefault.set(name, version);
			}
		}
	}

	if (config.catalogs && typeof config.catalogs === 'object') {
		for (const [catalogName, entries] of Object.entries(config.catalogs)) {
			if (entries && typeof entries === 'object') {
				const map = new Map<string, string>();
				for (const [pkgName, version] of Object.entries(entries)) {
					if (typeof version === 'string') {
						map.set(pkgName, version);
					}
				}
				catalogsNamed.set(catalogName, map);
			}
		}
	}

	return { catalogDefault, catalogsNamed };
}

/**
 * Parse workspace and catalog state for a given cwd.
 */
export function parsePnpmState(cwd: string): ParsedState {
	const workspaceRoot = findPnpmWorkspaceRoot(cwd);
	if (!workspaceRoot) {
		throw new Error(`Could not find pnpm-workspace.yaml by walking up from ${cwd}`);
	}

	const config = parsePnpmWorkspaceYaml(workspaceRoot);
	const packages = config.packages ?? [];
	const workspacePackages = buildWorkspacePackageMap(workspaceRoot, packages);
	const { catalogDefault, catalogsNamed } = buildCatalogMaps(config);

	return {
		workspaceRoot,
		workspacePackages,
		catalogDefault,
		catalogsNamed,
	};
}
