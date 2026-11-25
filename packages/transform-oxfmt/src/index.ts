import type { Plugin, Transform } from 'jsrepo';
import { type FormatOptions, format } from 'oxfmt';

/**
 * A plugin for jsrepo to format code with oxfmt.
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
 * The returned plugin can also be used with the legacy `transforms` option.
 *
 * @param options - The options for the plugin.
 */
export default function (options: FormatOptions = {}): Plugin & Transform {
	const transform: Transform = {
		transform: async ({ code, fileName }) => {
			return { code: await tryFormat(fileName, code, options) };
		},
	};

	return { ...transform, name: 'oxfmt', transforms: [transform] };
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
