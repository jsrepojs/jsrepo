import { Biome, Distribution } from '@biomejs/js-api';
import type { Plugin, Transform } from 'jsrepo';

/**
 * A plugin for jsrepo to format code with biome.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import biome from "@jsrepo/transform-biome";
 *
 * export default defineConfig({
 *  // ...
 *  plugins: [biome()],
 * });
 * ```
 *
 * The returned plugin can also be used with the legacy `transforms` option.
 */
export default function (): Plugin & Transform {
	const transform: Transform = {
		transform: async ({ code, fileName, options }) => {
			return {
				code: await tryFormat(code, { fileName: fileName, cwd: options.cwd }),
			};
		},
	};

	return { ...transform, name: 'biome', transforms: [transform] };
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
