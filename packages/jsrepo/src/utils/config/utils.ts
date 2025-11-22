import { cancel, confirm, isCancel } from '@clack/prompts';
import { err, ok, ResultAsync } from 'nevereverthrow';
import path from 'pathe';
import { createConfigLoader } from 'unconfig';
import type { AbsolutePath } from '@/api/utils';
import type { Config } from '@/utils/config';
import { ConfigNotFoundError, FailedToLoadConfigError } from '@/utils/errors';
import { createPathsMatcher, type PathsMatcher, tryGetTsconfig } from '@/utils/tsconfig';

/**
 * Regex to match valid JS variable names
 */
export const VALID_VARIABLE_NAME_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function _createConfigLoader({ cwd }: { cwd: string }) {
	return createConfigLoader<Config>({
		sources: [
			{
				files: ['jsrepo.config'],
				extensions: ['ts', 'js', 'mts', 'mjs'],
			},
		],
		merge: false,
		cwd,
	});
}

/**
 * Attempts to load the config. Returns an error if the config is not found.
 * @returns
 */
export function loadConfig({
	cwd,
}: {
	cwd: string;
}): ResultAsync<Config, ConfigNotFoundError | FailedToLoadConfigError> {
	return loadConfigOptional({ cwd }).andThen((v) => {
		if (v === null) return err(new ConfigNotFoundError(cwd));
		return ok(v);
	});
}

/**
 * Attempts to load the config. Will return null if the config is not found.
 * @returns
 */
export function loadConfigOptional({
	cwd,
}: {
	cwd: string;
}): ResultAsync<Config | null, FailedToLoadConfigError> {
	return ResultAsync.fromPromise(
		(async () => {
			const loadResult = await _createConfigLoader({ cwd }).load();
			if (loadResult.sources.length === 0) return null;

			return loadResult.config;
		})(),
		(err) => new FailedToLoadConfigError(err)
	);
}

/**
 * Searches for a a config file in the current directory (`jsrepo.config.(ts|js|mts|mjs)`)  it will search directories above the cwd until it finds a config file or reaches the user's home directory or root.
 *
 * @param cwd - The current working directory.
 * @param promptForContinueIfNull - Whether to prompt the user to continue if no config file is found.
 * @returns
 */
export async function loadConfigSearch({
	cwd,
	promptForContinueIfNull,
}: {
	cwd: AbsolutePath;
	promptForContinueIfNull: boolean;
}): Promise<{ config: Config; path: AbsolutePath } | null> {
	// search all supported config names and return the first one that exists
	const loadResult = await _createConfigLoader({ cwd }).load();

	if (loadResult.sources.length > 0) {
		return { config: loadResult.config, path: loadResult.sources[0]! as AbsolutePath };
	}

	let shouldContinue = !promptForContinueIfNull;

	if (!shouldContinue) {
		const response = await confirm({
			message: `You don't have jsrepo initialized in your project. Do you want to continue?`,
			initialValue: false,
		});

		if (isCancel(response)) {
			cancel('Canceled!');
			process.exit(0);
		}

		shouldContinue = response;
	}

	if (!shouldContinue) {
		cancel('Canceled!');
		process.exit(0);
	}

	return null;
}

export function getPathsMatcher({ cwd }: { cwd: AbsolutePath }): PathsMatcher {
	const tsConfig = tryGetTsconfig(cwd).unwrapOr(null);
	return tsConfig ? createPathsMatcher(tsConfig, { cwd }) : null;
}

/** Resolves the paths relative to the cwd */
export function resolvePaths(
	paths: Config['paths'],
	{ cwd, matcher }: { cwd: string; matcher: PathsMatcher }
): Config['paths'] {
	const newPaths: Config['paths'] = {};

	for (const [type, p] of Object.entries(paths)) {
		if (!p || p.trim() === '') continue;
		newPaths[type] = resolvePath(p, { cwd, matcher });
	}

	return newPaths;
}

export function resolvePath(
	p: string,
	{ cwd, matcher }: { cwd: string; matcher: PathsMatcher }
): string {
	if (matcher === null) {
		return path.relative(cwd, path.join(path.resolve(cwd), p));
	}

	const matchedPaths = matcher(p);
	const resolved = matchedPaths.length > 0 ? path.relative(cwd, matchedPaths[0]!) : undefined;

	if (!resolved) {
		return path.relative(cwd, path.join(path.resolve(cwd), p));
	}

	return resolved;
}
