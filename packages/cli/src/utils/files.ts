import type { PartialConfiguration } from '@biomejs/wasm-nodejs';
import color from 'chalk';
import escapeStringRegexp from 'escape-string-regexp';
import type * as prettier from 'prettier';
import { Err, Ok, type Result } from './blocks/types/result';
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
const transformRemoteContent = async ({
	file,
	config,
	imports,
	watermark,
	prettierOptions,
	biomeOptions,
	cwd,
	verbose,
}: TransformRemoteContentOptions): Promise<Result<string, string>> => {
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
};

type FormatOptions = {
	file: {
		/** The content of the file */
		content: string;
		/** The dest path of the file used to determine the language */
		destPath: string;
	};
	config: ProjectConfig;
	prettierOptions: prettier.Options | null;
	biomeOptions: PartialConfiguration | null;
};

/** Auto detects the language and formats the file content.
 *
 * @param param0
 * @returns
 */
const formatFile = async ({
	file,
	config,
	prettierOptions,
	biomeOptions,
}: FormatOptions): Promise<string> => {
	const lang = languages.find((lang) => lang.matches(file.destPath));

	let newContent = file.content;

	if (lang) {
		try {
			newContent = await lang.format(file.content, {
				filePath: file.destPath,
				formatter: config.formatter,
				prettierOptions,
				biomeOptions,
			});
		} catch {
			return newContent;
		}
	}

	return newContent;
};

export { transformRemoteContent, formatFile };
