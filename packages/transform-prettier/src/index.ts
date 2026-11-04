import path from 'node:path';
import type { Plugin, Transform } from 'jsrepo';
import { type Config, format, resolveConfig } from 'prettier';

export type Options = {
	/** The name of the prettier config file to use. @default ".prettierrc" */
	configFile?: string;
};

/**
 * A transform plugin for jsrepo to format code with prettier.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import prettier from "@jsrepo/transform-prettier";
 *
 * export default defineConfig({
 *  // ...
 *  plugins: [prettier()],
 * });
 * ```
 *
 * The returned plugin can also be used with the legacy `transforms` option.
 *
 * @param options - The options for the plugin.
 */
export default function (options: Options = {}): Plugin & Transform {
	const configPromise = resolveConfig(
		path.join(process.cwd(), options.configFile ?? '.prettierrc')
	);

	const transform: Transform = {
		transform: async ({ code, fileName }) => {
			const config = await configPromise;

			return { code: await tryFormat(code, { fileName: fileName, config }) };
		},
	};

	return { ...transform, name: 'prettier', transforms: [transform] };
}

function tryFormat(
	code: string,
	{ fileName, config }: { fileName: string; config: Config | null }
) {
	try {
		return format(code, { ...config, filepath: fileName });
	} catch {
		return undefined;
	}
}
