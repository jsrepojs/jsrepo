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
	dependencies: T[],
	{ pkg }: { pkg: Partial<PackageJson> }
): T[] {
	const deps = new Map<string, T>();
	for (const dep of dependencies) {
		let foundDep: string | undefined;

		if (dep.dev) {
			foundDep = pkg.devDependencies?.[dep.name];
		} else {
			foundDep = pkg.dependencies?.[dep.name];
		}

		// if version isn't pinned and dep exists delete
		if (dep.version === undefined && foundDep) {
			continue;
		}

		// if the version installed satisfies the requested version remove the dep
		if (
			foundDep &&
			(dep.version === undefined || semver.satisfies(cleanVersion(foundDep), dep.version))
		) {
			continue;
		}

		deps.set(dep.name, dep);
	}
	return Array.from(deps.values());
}
