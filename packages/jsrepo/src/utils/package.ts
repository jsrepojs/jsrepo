import fs from 'node:fs';
import os from 'node:os';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import semver from 'semver';
import type { RemoteDependency } from '@/utils/build';

export function findNearestPackageJson(
	cwd: string
): { path: string; package: Partial<PackageJson> } | undefined {
	if (cwd === os.homedir() || cwd === path.parse(cwd).root) return undefined;

	const packagePath = path.join(cwd, 'package.json');
	if (fs.existsSync(packagePath))
		return {
			path: packagePath,
			package: getPackage(packagePath),
		};

	return findNearestPackageJson(path.dirname(cwd));
}

export function tryGetPackage(path: string): Result<Partial<PackageJson>, string> {
	try {
		return ok(getPackage(path));
	} catch (error) {
		return err(`Error while trying to get package.json at ${path}: ${error}`);
	}
}

function getPackage(path: string): Partial<PackageJson> {
	return JSON.parse(fs.readFileSync(path).toString());
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
export function shouldInstall<T extends Omit<RemoteDependency, 'ecosystem'>>(
	dependencies: { dependencies: T[]; devDependencies: T[] },
	{ pkg }: { pkg: Partial<PackageJson> }
): { dependencies: T[]; devDependencies: T[] } {
	function shouldShouldInstallDependency(
		dep: T,
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

	const deps = new Map<string, T>();
	for (const dep of dependencies.dependencies) {
		if (!shouldShouldInstallDependency(dep, pkg.dependencies)) continue;

		deps.set(dep.name, dep);
	}
	const devDeps = new Map<string, T>();
	for (const dep of dependencies.devDependencies) {
		if (!shouldShouldInstallDependency(dep, pkg.devDependencies)) continue;

		devDeps.set(dep.name, dep);
	}
	return {
		dependencies: Array.from(deps.values()),
		devDependencies: Array.from(devDeps.values()),
	};
}
