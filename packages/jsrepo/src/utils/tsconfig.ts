import { createPathsMatcher, getTsconfig, type TsConfigResult } from 'get-tsconfig';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import type { AbsolutePath } from '@/utils/types';
import { existsSync, statSync } from './fs';
import { dirname, joinAbsolute } from './path';

/** Attempts to get the js/tsconfig file for the searched path
 *
 * @param searchPath
 * @returns
 */
export function tryGetTsconfig(
	searchPath?: string,
	fileName?: string
): Result<TsConfigResult | null, string> {
	let config: TsConfigResult | null;

	try {
		config = getTsconfig(searchPath, fileName);

		if (!config) {
			// if we don't find the config at first check for a jsconfig
			config = getTsconfig(searchPath, fileName);

			if (!config) {
				return ok(null);
			}
		}
	} catch (e) {
		return err(`Error while trying to get ${pc.bold(fileName || 'tsconfig.json')}: ${e}`);
	}

	return ok(config);
}

export type PathsMatcher = ((specifier: string) => string[]) | null;

export function _createPathsMatcher(
	configResult: TsConfigResult,
	{ cwd }: { cwd: AbsolutePath }
): PathsMatcher {
	const matcher = createPathsMatcher(configResult);

	if (!configResult.config.references) return matcher;

	const matchers: ((specifier: string) => string[])[] = matcher ? [matcher] : [];

	// resolve tsconfig references
	for (const configPath of configResult.config.references) {
		const configPathOrDir = joinAbsolute(cwd, configPath.path);

		if (!existsSync(configPathOrDir)) continue;

		let directory: AbsolutePath;
		let fileName = 'tsconfig.json';

		// references can be a file or a directory https://www.typescriptlang.org/docs/handbook/project-references.html
		if (statSync(configPathOrDir)._unsafeUnwrap().isFile()) {
			directory = dirname(configPathOrDir);
			fileName = path.basename(configPathOrDir);
		} else {
			directory = configPathOrDir;
		}

		const config = tryGetTsconfig(directory, fileName).unwrapOr(null);

		if (config === null) continue;

		const matcher = _createPathsMatcher(config, { cwd: directory });

		if (matcher) matchers.push(matcher);
	}

	if (matchers.length === 0) return null;

	// get all possible paths from all matchers
	return (specifier: string) => matchers.flatMap((matcher) => matcher(specifier));
}

export { _createPathsMatcher as createPathsMatcher };
