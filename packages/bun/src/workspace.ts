import fs, { existsSync } from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { dirname, join, resolve } from 'pathe';

export type WorkspacePackage = {
	name: string;
	version: string;
};

type PackageJsonWithWorkspaces =
	| { workspaces?: string[] }
	| { workspaces?: { packages?: string[] } };

/**
 * Walk up from cwd to find a package.json with a workspaces field.
 */
export function findBunWorkspaceRoot(cwd: string): string | null {
	let dir = resolve(cwd);
	const pathRoot = path.parse(dir).root;

	while (dir !== pathRoot) {
		const pkgPath = join(dir, 'package.json');
		if (existsSync(pkgPath)) {
			try {
				const content = fs.readFileSync(pkgPath, 'utf-8');
				const pkg = JSON.parse(content) as PackageJsonWithWorkspaces;
				if (pkg.workspaces) {
					return dir;
				}
			} catch {
				// ignore parse errors
			}
		}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}

	return null;
}

/**
 * Extract workspace package patterns from package.json.
 * Supports workspaces: ["packages/*"] and workspaces: { packages: ["packages/*"] }
 */
export function getWorkspacePatterns(workspaceRoot: string): string[] {
	const pkgPath = join(workspaceRoot, 'package.json');
	if (!existsSync(pkgPath)) return [];
	try {
		const content = fs.readFileSync(pkgPath, 'utf-8');
		const pkg = JSON.parse(content) as PackageJsonWithWorkspaces;
		const workspaces = pkg.workspaces;
		if (Array.isArray(workspaces)) {
			return workspaces;
		}
		if (workspaces && typeof workspaces === 'object' && Array.isArray(workspaces.packages)) {
			return workspaces.packages;
		}
		return [];
	} catch {
		return [];
	}
}

/**
 * Expand workspace package globs to absolute directory paths.
 */
export function expandWorkspacePackages(workspaceRoot: string, packages: string[]): string[] {
	const dirs: string[] = [];
	for (const pattern of packages) {
		const matches = fg.sync(pattern, {
			cwd: workspaceRoot,
			onlyDirectories: true,
			absolute: true,
		});
		dirs.push(...matches);
	}
	return [...new Set(dirs)];
}

/**
 * Read package.json and return name and version. Returns null if invalid.
 */
function readPackageInfo(dir: string): WorkspacePackage | null {
	const pkgPath = join(dir, 'package.json');
	if (!existsSync(pkgPath)) return null;
	try {
		const content = fs.readFileSync(pkgPath, 'utf-8');
		const pkg = JSON.parse(content) as { name?: string; version?: string };
		if (typeof pkg.name === 'string' && typeof pkg.version === 'string') {
			return { name: pkg.name, version: pkg.version };
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Build a map of package name -> version from workspace packages.
 */
export function buildWorkspacePackageMap(
	workspaceRoot: string,
	packages: string[]
): Map<string, string> {
	const map = new Map<string, string>();
	const dirs = expandWorkspacePackages(workspaceRoot, packages);

	for (const dir of dirs) {
		const info = readPackageInfo(dir);
		if (info) {
			map.set(info.name, info.version);
		}
	}

	return map;
}
