import { Biome, Distribution } from '@biomejs/js-api';
import type { Transform } from 'jsrepo';

/**
 * A transform plugin for jsrepo to format code with prettier.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import biome from "@jsrepo/transform-biome";
 *
 * export default defineConfig({
 *  // ...
 *  transforms: [biome()],
 * });
 * ```
 *
 * @param options - The options for the transform plugin.
 */
export default function (): Transform {
	return {
		transform: async ({ code, fileName, options }) => {
			return {
				code: await tryFormat(code, { fileName: fileName, cwd: options.cwd }),
			};
		},
	};
}

async function tryFormat(code: string, { fileName, cwd }: { fileName: string; cwd: string }) {
	try {
		const biome = await Biome.create({
			distribution: Distribution.NODE,
		});

		const { projectKey } = biome.openProject(cwd);

		return biome.formatContent(projectKey, code, { filePath: fileName }).content;
	} catch (err) {
		console.error(err);
		return undefined;
	}
}
