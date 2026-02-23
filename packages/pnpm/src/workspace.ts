import fs, { existsSync } from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { dirname, join, resolve } from 'pathe';

export type WorkspacePackage = {
	name: string;
	version: string;
};

/**
 * Walk up from cwd to find the directory containing pnpm-workspace.yaml.
 */
export function findPnpmWorkspaceRoot(cwd: string): string | null {
	let dir = resolve(cwd);
	const root = path.parse(dir).root;

	while (dir !== root) {
		const workspaceFile = join(dir, 'pnpm-workspace.yaml');
		if (existsSync(workspaceFile)) {
			return dir;
		}
		dir = dirname(dir);
	}

	return null;
}

/**
 * Expand workspace package globs (e.g. "packages/*") to absolute directory paths.
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
