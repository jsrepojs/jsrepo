import path from 'node:path';
import type { Transform } from 'jsrepo';
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
 *  transforms: [prettier()],
 * });
 * ```
 *
 * @param options - The options for the transform plugin.
 */
export default function (options: Options = {}): Transform {
	const configPromise = resolveConfig(
		path.join(process.cwd(), options.configFile ?? '.prettierrc')
	);

	return {
		transform: async ({ code, fileName }) => {
			const config = await configPromise;

			return { code: await tryFormat(code, { fileName: fileName, config }) };
		},
	};
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
