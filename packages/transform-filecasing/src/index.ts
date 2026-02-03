import { camelCase, kebabCase, pascalCase, snakeCase } from 'change-case';
import type { Transform } from 'jsrepo';
import type { ItemRelativePath } from 'jsrepo/utils';

export type CaseType = 'kebab' | 'camel' | 'snake' | 'pascal';

export type Options = {
	/** The target case format to transform file and folder names to. */
	to: CaseType;
	/** Whether to transform directory segments in the path. When `false`, only the filename baseName is transformed. @default true */
	transformDirectories?: boolean;
};

const caseTransformers: Record<CaseType, (input: string) => string> = {
	kebab: kebabCase,
	camel: camelCase,
	snake: snakeCase,
	pascal: pascalCase,
};

/**
 * A transform plugin for jsrepo to transform file and folder name cases.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import fileCasing from "@jsrepo/transform-filecasing";
 *
 * export default defineConfig({
 *  // ...
 *  transforms: [fileCasing({ to: "camel" })],
 * });
 * ```
 *
 * @param options - The options for the transform plugin.
 */
export default function ({
	to = 'kebab',
	transformDirectories = true,
}: Partial<Options> = {}): Transform {
	const transformer = caseTransformers[to];
	if (!transformer) {
		throw new Error(`Invalid case type: "${to}". Expected one of: kebab, camel, snake, pascal`);
	}

	return {
		transform: async ({ fileName }) => {
			const parts = fileName.split('/');

			const transformedParts = parts.map((part, index) => {
				// Handle filename (last segment)
				if (index === parts.length - 1) {
					// Extract the base name (first part before any dot) and extensions
					// example: my-file.test.ts -> my-file & .test.ts
					const firstDotIndex = part.indexOf('.');
					const baseName = firstDotIndex >= 0 ? part.slice(0, firstDotIndex) : part;
					const extensions = firstDotIndex >= 0 ? part.slice(firstDotIndex) : '';
					const transformedBaseName = transformer(baseName);

					return `${transformedBaseName}${extensions}`;
				}

				// Transform directory segments only if transformDirectories is true
				return transformDirectories ? transformer(part) : part;
			});

			const newFileName = transformedParts.join('/') as ItemRelativePath;

			if (newFileName === fileName) {
				return {};
			}

			return {
				fileName: newFileName,
			};
		},
	};
}
