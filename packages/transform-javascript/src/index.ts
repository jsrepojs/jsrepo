import { strip } from '@svecosystem/strip-types';
import type { Transform } from 'jsrepo';
import { Unreachable } from 'jsrepo/errors';
import { transform } from 'sucrase';

export type FileExtension = {
	/** The TypeScript extension. */
	ts: string;
	/** The JavaScript extension. */
	js?: string;
};

export type Options = {
	supportedExtensions?: FileExtension[];
};

export const SUPPORTED_EXTENSIONS: FileExtension[] = [
	{ ts: 'ts', js: 'js' },
	{ ts: 'mts', js: 'mjs' },
	{ ts: 'tsx', js: 'jsx' },
	{ ts: 'svelte', js: 'svelte' },
];

/**
 * A transform plugin for jsrepo to strip types from TypeScript code. It also renames TypeScript files to JavaScript files.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import stripTypes from "@jsrepo/transform-javascript";
 *
 * export default defineConfig({
 *  // ...
 *  transforms: [stripTypes()],
 * });
 * ```
 *
 * @param options - The options for the transform plugin.
 */
export default function ({ supportedExtensions = SUPPORTED_EXTENSIONS }: Options = {}): Transform {
	return {
		transform: async ({ code, fileName }) => {
			if (
				!endsWithOneOf(
					fileName,
					supportedExtensions.map((extension) => extension.ts)
				)
			)
				return { code };

			if (fileName.endsWith('.svelte')) {
				return {
					code: strip(code),
					fileName: updateFileExtension(fileName, supportedExtensions),
				};
			}

			return {
				code: transform(code, {
					transforms: ['typescript', 'jsx'],
					disableESTransforms: true,
					filePath: fileName,
					jsxRuntime: 'preserve',
				}).code,
				fileName: updateFileExtension(fileName, supportedExtensions),
			};
		},
	};
}

function endsWithOneOf(fileName: string, extensions: string[]): boolean {
	return extensions.some((extension) => fileName.endsWith(extension));
}

function updateFileExtension(fileName: string, extensions: FileExtension[]): string {
	for (const extension of extensions) {
		if (fileName.endsWith(extension.ts)) {
			return fileName.replace(`.${extension.ts}`, `.${extension.js ?? extension.ts}`);
		}
	}
	throw new Unreachable();
}
