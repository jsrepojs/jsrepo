import * as v from 'vue/compiler-sfc';
import { getImports, installDependencies, resolveImports, transformImports } from '@/langs/js';
import type { Language } from '@/langs/types';

// biome-ignore lint/complexity/noBannedTypes: leave me alone for a minute
export type VueOptions = {};

/**
 * Vue language support.
 */
export function vue(_options: VueOptions = {}): Language {
	return {
		name: 'vue',
		canResolveDependencies: (fileName) => fileName.endsWith('.vue'),
		resolveDependencies: async (code, opts) => {
			const neededScripts: string[] = [];
			const parsed = v.parse(code, {
				filename: opts.fileName,
			});
			if (parsed.descriptor.script) {
				neededScripts.push(parsed.descriptor.script.content);
			}
			if (parsed.descriptor.scriptSetup) {
				neededScripts.push(parsed.descriptor.scriptSetup.content);
			}
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
