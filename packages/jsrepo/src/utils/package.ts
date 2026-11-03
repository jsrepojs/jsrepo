import os from 'node:os';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import semver from 'semver';
import type { AbsolutePath } from '@/api/utils';
import type { RemoteDependency } from '@/utils/build';
import { existsSync, readFileSync } from './fs';
import { dirname, joinAbsolute } from './path';

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

const SUPPORTED_PACKAGE_IMPORT_CONDITIONS = new Set(['default', 'import', 'node']);

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

export function getMatchingPackageImport(
	specifier: string,
	imports: Record<string, unknown>
): { target: unknown; wildcardMatch?: string } | null {
	if (Object.hasOwn(imports, specifier)) {
		return { target: imports[specifier] };
	}

	const patternMatches: Array<{
		target: unknown;
		wildcardMatch: string;
		prefixLength: number;
		suffixLength: number;
	}> = [];

	for (const [key, target] of Object.entries(imports)) {
		const wildcardIndex = key.indexOf('*');
		if (wildcardIndex === -1) continue;

		const prefix = key.slice(0, wildcardIndex);
		const suffix = key.slice(wildcardIndex + 1);

		if (!specifier.startsWith(prefix)) continue;
		if (!specifier.endsWith(suffix)) continue;

		patternMatches.push({
			target,
			wildcardMatch: specifier.slice(prefix.length, specifier.length - suffix.length),
			prefixLength: prefix.length,
			suffixLength: suffix.length,
		});
	}

	if (patternMatches.length === 0) return null;

	patternMatches.sort((a, b) => {
		if (a.prefixLength !== b.prefixLength) return b.prefixLength - a.prefixLength;
		return b.suffixLength - a.suffixLength;
	});

	const bestMatch = patternMatches[0];
	if (!bestMatch) return null;

	return {
		target: bestMatch.target,
		wildcardMatch: bestMatch.wildcardMatch,
	};
}

export function resolvePackageImportTargets(target: unknown, wildcardMatch?: string): string[] {
	if (typeof target === 'string') {
		if (wildcardMatch === undefined) return [target];
		return [target.replaceAll('*', wildcardMatch)];
	}

	if (Array.isArray(target)) {
		return target.flatMap((entry) => resolvePackageImportTargets(entry, wildcardMatch));
	}

	if (isRecord(target)) {
		const resolvedTargets: string[] = [];

		for (const [condition, value] of Object.entries(target)) {
			if (!SUPPORTED_PACKAGE_IMPORT_CONDITIONS.has(condition)) continue;
			resolvedTargets.push(...resolvePackageImportTargets(value, wildcardMatch));
		}

		return resolvedTargets;
	}

	return [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Resolves a `#` subpath import (ex: `#lib`) to the directory it points to using the `imports` field of the nearest package.json.
 *
 * The wildcard entry (ex: `#lib/*`) is preferred over the exact entry since the exact entry
 * will usually point to a file (ex: `./src/lib/index.js`) and not the directory.
 *
 * @returns the directory relative to `cwd` or `null` if it could not be resolved.
 */
export function resolvePackageImportsDirectory(
	specifier: string,
	{ cwd }: { cwd: AbsolutePath }
): string | null {
	const nearestPackage = findNearestPackageJson(cwd);
	if (!nearestPackage) return null;

	const imports = nearestPackage.package.imports;
	if (!isRecord(imports)) return null;

	const packageRoot = dirname(nearestPackage.path);
	const normalized = specifier.replace(/\/+$/, '');

	// `#lib/` matches `#lib/*` with an empty wildcard match
	const wildcardMatch = getMatchingPackageImport(`${normalized}/`, imports);
	const exactMatch = getMatchingPackageImport(normalized, imports);

	const candidates = [
		...(wildcardMatch
			? resolvePackageImportTargets(wildcardMatch.target, wildcardMatch.wildcardMatch)
			: []),
		// exact entries are only valid when they point to a directory
		...(exactMatch
			? resolvePackageImportTargets(exactMatch.target, exactMatch.wildcardMatch).filter(
					(target) => path.extname(target) === ''
				)
			: []),
	];

	for (const target of candidates) {
		if (!target.startsWith('.')) continue;
		return path.relative(cwd, path.join(packageRoot, target));
	}

	return null;
}
