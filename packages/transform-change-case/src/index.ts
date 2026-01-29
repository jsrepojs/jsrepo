import { camelCase, kebabCase, pascalCase, snakeCase } from 'change-case';
import type { Transform } from 'jsrepo';
import type { ItemRelativePath } from 'jsrepo/utils';

export type CaseType = 'kebab' | 'camel' | 'snake' | 'pascal';

export type Options = {
	/** The target case format to transform filenames to. */
	to: CaseType;
};

const caseTransformers: Record<CaseType, (input: string) => string> = {
	kebab: kebabCase,
	camel: camelCase,
	snake: snakeCase,
	pascal: pascalCase,
};

/**
 * A transform plugin for jsrepo to transform file name cases.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import changeCase from "@jsrepo/transform-change-case";
 *
 * export default defineConfig({
 *  // ...
 *  transforms: [changeCase({ to: "camel" })],
 * });
 * ```
 *
 * @param options - The options for the transform plugin.
 */
export default function ({ to }: Options): Transform {
	const transformer = caseTransformers[to];

	return {
		transform: async ({ code, fileName }) => {
			const lastSlashIndex = fileName.lastIndexOf('/');
			const directory = lastSlashIndex >= 0 ? fileName.slice(0, lastSlashIndex + 1) : '';
			const fullFilename =
				lastSlashIndex >= 0 ? fileName.slice(lastSlashIndex + 1) : fileName;

			// Extract the base name (first part before any dot) and extensions
			const firstDotIndex = fullFilename.indexOf('.');
			const baseName =
				firstDotIndex >= 0 ? fullFilename.slice(0, firstDotIndex) : fullFilename;
			const extensions = firstDotIndex >= 0 ? fullFilename.slice(firstDotIndex) : '';

			const transformedBaseName = transformer(baseName);

			// If no change needed, return code only without fileName
			if (transformedBaseName === baseName) {
				return { code };
			}

			const newFileName =
				`${directory}${transformedBaseName}${extensions}` as ItemRelativePath;

			return {
				code,
				fileName: newFileName,
			};
		},
	};
}
