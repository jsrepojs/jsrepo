import fs from 'node:fs';
import color from 'chalk';
import { createPathsMatcher, getTsconfig, type TsConfigResult } from 'get-tsconfig';
import path from 'pathe';
import { Err, Ok, type Result } from './blocks/ts/result';

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
				return Ok(null);
			}
		}
	} catch (err) {
		return Err(`Error while trying to get ${color.bold(fileName || 'tsconfig.json')}: ${err}`);
	}

	return Ok(config);
}

export function _createPathsMatcher(
	configResult: TsConfigResult,
	{ cwd }: { cwd: string }
): ((specifier: string) => string[]) | null {
	const matcher = createPathsMatcher(configResult);

	if (!configResult.config.references) return matcher;

	const matchers: ((specifier: string) => string[])[] = matcher ? [matcher] : [];

	// resolve tsconfig references
	for (const configPath of configResult.config.references) {
		const configPathOrDir = path.join(cwd, configPath.path);

		if (!fs.existsSync(configPathOrDir)) continue;

		let directory: string;
		let fileName = 'tsconfig.json';

		// references can be a file or a directory https://www.typescriptlang.org/docs/handbook/project-references.html
		if (fs.statSync(configPathOrDir).isFile()) {
			directory = path.dirname(configPathOrDir);
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
