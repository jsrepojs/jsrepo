import { strip } from '@svecosystem/strip-types';
import type { Plugin, Transform } from 'jsrepo';
import { Unreachable } from 'jsrepo/errors';
import type { ItemRelativePath } from 'jsrepo/utils';
import { transform as sucraseTransform } from 'sucrase';

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
 * A plugin for jsrepo to strip types from TypeScript code. It also renames TypeScript files to JavaScript files.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import stripTypes from "@jsrepo/transform-javascript";
 *
 * export default defineConfig({
 *  // ...
 *  plugins: [stripTypes()],
 * });
 * ```
 *
 * The returned plugin can also be used with the legacy `transforms` option.
 *
 * @param options - The options for the plugin.
 */
export default function ({
	supportedExtensions = SUPPORTED_EXTENSIONS,
}: Options = {}): Plugin & Transform {
	const transform: Transform = {
		transform: async ({ code, fileName }) => {
			if (
				!endsWithOneOf(
					fileName,
					supportedExtensions.map((extension) => extension.ts)
				)
			) {
				return { code };
			}

			if (fileName.endsWith('.svelte')) {
				return {
					code: strip(code),
					fileName: updateFileExtension(fileName, supportedExtensions),
				};
			}

			return {
				code: sucraseTransform(code, {
					transforms: ['typescript', 'jsx'],
					disableESTransforms: true,
					filePath: fileName,
					jsxRuntime: 'preserve',
				}).code,
				fileName: updateFileExtension(fileName, supportedExtensions),
			};
		},
	};

	return { ...transform, name: 'javascript', transforms: [transform] };
}

function endsWithOneOf(fileName: string, extensions: string[]): boolean {
	return extensions.some((extension) => fileName.endsWith(extension));
}

function updateFileExtension(
	fileName: ItemRelativePath,
	extensions: FileExtension[]
): ItemRelativePath {
	for (const extension of extensions) {
		if (fileName.endsWith(extension.ts)) {
			return fileName.replace(
				`.${extension.ts}`,
				`.${extension.js ?? extension.ts}`
			) as ItemRelativePath;
		}
	}
	throw new Unreachable();
}
