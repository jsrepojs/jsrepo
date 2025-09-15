import fs from 'node:fs';
import path from 'pathe';
import semver from 'semver';
import { Err, Ok, type Result } from './blocks/ts/result';
import { parsePackageName } from './parse-package-name';

function findNearestPackageJson(startDir: string, until: string): string | undefined {
	const packagePath = path.join(startDir, 'package.json');

	if (fs.existsSync(packagePath)) return packagePath;

	if (startDir === until) return undefined;

	const segments = startDir.split(/[/\\]/);

	return findNearestPackageJson(segments.slice(0, segments.length - 1).join('/'), until);
}

export type PackageJson = {
	name: string;
	version: string;
	description: string;
	scripts: Record<string, string>;
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
};

function getPackage(path: string): Result<Partial<PackageJson>, string> {
	if (!fs.existsSync(path)) return Err(`${path} doesn't exist`);

	const contents = fs.readFileSync(path).toString();

	try {
		return Ok(JSON.parse(contents));
	} catch (err) {
		return Err(`Error reading package.json: ${err}`);
	}
}

export function cleanVersion(version: string) {
	if (version[0] === '^') {
		return version.slice(1);
	}

	return version;
}

/** Returns only the dependencies that should be installed based on what is already in the package.json */
function returnShouldInstall(
	dependencies: Set<string>,
	devDependencies: Set<string>,
	{ cwd }: { cwd: string }
): { devDependencies: Set<string>; dependencies: Set<string> } {
	// don't mutate originals
	const tempDeps = dependencies;
	const tempDevDeps = devDependencies;

	const packageResult = getPackage(path.join(cwd, 'package.json'));

	if (!packageResult.isErr()) {
		const pkg = packageResult.unwrap();

		if (pkg.dependencies) {
			for (const dep of tempDeps) {
				// this was already parsed when building
				const { name, version } = parsePackageName(dep).unwrap();

				const foundDep = pkg.dependencies[name];

				// if version isn't pinned and dep exists delete
				if (version === undefined && foundDep) {
					tempDeps.delete(dep);
					continue;
				}

				// if the version installed satisfies the requested version remove the dep
				if (foundDep && semver.satisfies(cleanVersion(foundDep), version!)) {
					tempDeps.delete(dep);
				}
			}
		}

		if (pkg.devDependencies) {
			for (const dep of tempDevDeps) {
				// this was already parsed when building
				const { name, version } = parsePackageName(dep).unwrap();

				const foundDep = pkg.devDependencies[name];

				// if version isn't pinned and dep exists delete
				if (version === undefined && foundDep) {
					tempDevDeps.delete(dep);
					continue;
				}

				// if the version installed satisfies the requested version remove the dep
				if (foundDep && semver.satisfies(cleanVersion(foundDep), version!)) {
					tempDevDeps.delete(dep);
				}
			}
		}
	}

	return { dependencies: tempDeps, devDependencies: tempDevDeps };
}

export { findNearestPackageJson, getPackage, returnShouldInstall };
