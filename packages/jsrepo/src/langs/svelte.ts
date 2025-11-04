import * as sv from 'svelte/compiler';
import { getImports, installDependencies, resolveImports, transformImports } from '@/langs/js';
import type { Language } from '@/langs/types';

// biome-ignore lint/complexity/noBannedTypes: leave me alone for a minute
export type SvelteOptions = {};

/**
 * Svelte language support.
 */
export function svelte(_options: SvelteOptions = {}): Language {
	return {
		name: 'svelte',
		canResolveDependencies: (fileName) => fileName.endsWith('.svelte'),
		resolveDependencies: async (code, opts) => {
			const neededScripts: string[] = [];
			await sv.preprocess(code, {
				script: async ({ content }) => {
					neededScripts.push(content);
				},
			});
			const imports = await Promise.all(
				neededScripts.map(async (script) => {
					return await resolveImports(
						await getImports(script, `${opts.fileName}.ts`),
						opts
					);
				})
			);
			return imports.flat();
		},
		transformImports: async (imports, opts) => transformImports(imports, opts),
		canInstallDependencies: (ecosystem) => ecosystem === 'js',
		installDependencies: async (deps, opts) => installDependencies(deps, opts),
	};
}
