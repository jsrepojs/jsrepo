import { definePlugin, type Transform } from 'jsrepo';
import { type FormatOptions, format } from 'oxfmt';

/**
 * A transform plugin for jsrepo to format code with oxfmt.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import oxfmt from "@jsrepo/transform-oxfmt";
 *
 * export default defineConfig({
 *  // ...
 *  plugins: [oxfmt()],
 * });
 * ```
 *
 * @param options - The options for the transform plugin.
 */
export function createOxfmtTransform(options: FormatOptions = {}): Transform {
	return {
		transform: async ({ code, fileName }) => {
			return { code: await tryFormat(fileName, code, options) };
		},
	};
}

async function tryFormat(
	fileName: string,
	code: string,
	options: FormatOptions
): Promise<string | undefined> {
	try {
		const result = await format(fileName, code, options);
		if (result.errors.length > 0) {
			return undefined;
		}
		return result.code;
	} catch {
		return undefined;
	}
}

export default function oxfmt(options: FormatOptions = {}) {
	return definePlugin({
		transforms: [createOxfmtTransform(options)],
	});
}
