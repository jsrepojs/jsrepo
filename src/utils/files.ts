import fs from 'node:fs';
import type { PartialConfiguration } from '@biomejs/wasm-nodejs';
import color from 'chalk';
import escapeStringRegexp from 'escape-string-regexp';
import { type TsConfigResult, getTsconfig } from 'get-tsconfig';
import path from 'pathe';
import type * as prettier from 'prettier';
import { Err, Ok, type Result } from './blocks/ts/result';
import { endsWithOneOf } from './blocks/ts/strings';
import type { ProjectConfig } from './config';
import { resolveLocalDependencyTemplate } from './dependencies';
import { languages } from './language-support';

type TransformRemoteContentOptions = {
	file: {
		/** The content of the file */
		content: string;
		/** The dest path of the file used to determine the language */
		destPath: string;
	};
	config: ProjectConfig;
	watermark: string;
	imports: Record<string, string>;
	prettierOptions: prettier.Options | null;
	biomeOptions: PartialConfiguration | null;
	cwd: string;
	verbose?: (msg: string) => void;
};

/** Makes the necessary modifications to the content of the file to ensure it works properly in the users project
 *
 * @param param0
 * @returns
 */
export async function transformRemoteContent({
	file,
	config,
	imports,
	watermark,
	prettierOptions,
	biomeOptions,
	cwd,
	verbose,
}: TransformRemoteContentOptions): Promise<Result<string, string>> {
	const lang = languages.find((lang) => lang.matches(file.destPath));

	let content: string = file.content;

	if (lang) {
		if (config.watermark) {
			const comment = lang.comment(watermark);

			content = `${comment}\n\n${content}`;
		}

		verbose?.(`Formatting ${color.bold(file.destPath)}`);

		try {
			content = await lang.format(content, {
				filePath: file.destPath,
				formatter: config.formatter,
				prettierOptions,
				biomeOptions,
			});
		} catch (err) {
			return Err(`Error formatting ${color.bold(file.destPath)} ${err}`);
		}
	}

	// transform imports
	for (const [literal, template] of Object.entries(imports)) {
		const resolvedImport = resolveLocalDependencyTemplate({
			template,
			config,
			destPath: file.destPath,
			cwd,
		});

		// this way we only replace the exact import since it will be surrounded in quotes
		const literalRegex = new RegExp(`(['"])${escapeStringRegexp(literal)}\\1`, 'g');

		content = content.replaceAll(literalRegex, `$1${resolvedImport}$1`);
	}

	return Ok(content);
}

type FormatOptions = {
	file: {
		/** The content of the file */
		content: string;
		/** The dest path of the file used to determine the language */
		destPath: string;
	};
	formatter: ProjectConfig['formatter'];
	prettierOptions: prettier.Options | null;
	biomeOptions: PartialConfiguration | null;
};

/** Auto detects the language and formats the file content.
 *
 * @param param0
 * @returns
 */
export async function formatFile({
	file,
	formatter,
	prettierOptions,
	biomeOptions,
}: FormatOptions): Promise<string> {
	const lang = languages.find((lang) => lang.matches(file.destPath));

	let newContent = file.content;

	if (lang) {
		try {
			newContent = await lang.format(file.content, {
				filePath: file.destPath,
				formatter,
				prettierOptions,
				biomeOptions,
			});
		} catch {
			return newContent;
		}
	}

	return newContent;
}

export function matchJSDescendant(searchFilePath: string): string | undefined {
	const MATCH_EXTENSIONS = ['.js', '.ts', '.cjs', '.mjs'];

	if (!endsWithOneOf(searchFilePath, MATCH_EXTENSIONS)) return undefined;

	const dir = path.dirname(searchFilePath);

	const files = fs.readdirSync(dir);

	const parsedSearch = path.parse(searchFilePath);

	for (const file of files) {
		if (!endsWithOneOf(file, MATCH_EXTENSIONS)) continue;

		if (path.parse(file).name === parsedSearch.name) return path.join(dir, file);
	}

	return undefined;
}

/** Attempts to get the js/tsconfig file for the searched path
 *
 * @param searchPath
 * @returns
 */
export function tryGetTsconfig(searchPath?: string): Result<TsConfigResult | null, string> {
	let config: TsConfigResult | null;

	try {
		config = getTsconfig(searchPath, 'tsconfig.json');

		if (!config) {
			// if we don't find the config at first check for a jsconfig
			config = getTsconfig(searchPath, 'jsconfig.json');

			if (!config) {
				return Ok(null);
			}
		}
	} catch (err) {
		return Err(`Error while trying to get ${color.bold('tsconfig.json')}: ${err}`);
	}

	return Ok(config);
}
