import { Biome, Distribution } from '@biomejs/js-api';
import { definePlugin, type Transform } from 'jsrepo';

/**
 * A transform plugin for jsrepo to format code with biome.
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
 */
export function createBiomeTransform(): Transform {
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

export default function biome() {
	return definePlugin({
		transforms: [createBiomeTransform()],
	});
}
