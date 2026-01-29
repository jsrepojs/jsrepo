import type { Transform } from 'jsrepo';
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
 *  transforms: [oxfmt()],
 * });
 * ```
 *
 * @param options - The options for the transform plugin.
 */
export default function (options: FormatOptions = {}): Transform {
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
		return result.code;
	} catch {
		return undefined;
	}
}
