import os from 'node:os';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import semver from 'semver';
import { existsSync, readFileSync } from './fs';
import { parsePackageName } from './parse-package-name';
import { dirname, joinAbsolute } from './path';
import type { AbsolutePath } from './types';

export function findNearestPackageJson(
	cwd: AbsolutePath
): { path: AbsolutePath; package: Partial<PackageJson> } | undefined {
	if (cwd === os.homedir() || cwd === path.parse(cwd).root) return undefined;

	const packagePath = joinAbsolute(cwd, 'package.json');
	if (existsSync(packagePath))
		return {
			path: packagePath,
			package: getPackage(packagePath),
		};

	return findNearestPackageJson(dirname(cwd));
}

export function tryGetPackage(path: AbsolutePath): Result<Partial<PackageJson>, string> {
	try {
		return ok(getPackage(path));
	} catch (error) {
		return err(`Error while trying to get package.json at ${path}: ${error}`);
	}
}

function getPackage(path: AbsolutePath): Partial<PackageJson> {
	return JSON.parse(readFileSync(path)._unsafeUnwrap().toString());
}

export type PackageJson = {
	name: string;
	version: string;
	description: string;
	scripts: Record<string, string>;
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
	type: string;
	// rest props
	[key: string]: unknown;
};

export function cleanVersion(version: string) {
	if (version[0] === '^') {
		return version.slice(1);
	}

	return version;
}

/** Returns only the dependencies that should be installed based on what is already in the package.json */
export function shouldInstall(
	dependencies: { dependencies: string[]; devDependencies: string[] },
	{ pkg }: { pkg: Partial<PackageJson> }
): { dependencies: string[]; devDependencies: string[] } {
	function shouldShouldInstallDependency(
		dep: { name: string; version: string | undefined },
		pkgDeps: Record<string, string> | undefined
	): boolean {
		const foundDep = pkgDeps?.[dep.name];

		// if version isn't pinned and dep exists delete
		if (dep.version === undefined && foundDep) {
			return false;
		}

		// if the version installed satisfies the requested version remove the dep
		if (
			foundDep &&
			(dep.version === undefined || semver.satisfies(cleanVersion(foundDep), dep.version))
		) {
			return false;
		}

		return true;
	}

	const deps = new Set<string>();
	for (const dep of dependencies.dependencies) {
		const parsed = parsePackageName(dep)._unsafeUnwrap();
		if (!shouldShouldInstallDependency(parsed, pkg.dependencies)) continue;

		deps.add(dep);
	}
	const devDeps = new Set<string>();
	for (const dep of dependencies.devDependencies) {
		const parsed = parsePackageName(dep)._unsafeUnwrap();
		if (!shouldShouldInstallDependency(parsed, pkg.devDependencies)) continue;

		devDeps.add(dep);
	}
	return {
		dependencies: Array.from(deps.values()),
		devDependencies: Array.from(devDeps.values()),
	};
}
