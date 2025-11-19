import { getImports, installDependencies, resolveImports, transformImports } from '@/langs/js';
import type { Language } from '@/langs/types';
import { MissingPeerDependencyError } from '@/utils/errors';
import type { AbsolutePath } from '@/utils/types';

// biome-ignore lint/complexity/noBannedTypes: leave me alone for a minute
export type VueOptions = {};

let vueCompiler: typeof import('vue/compiler-sfc') | null = null;

async function loadVueCompiler() {
	if (vueCompiler) {
		return vueCompiler;
	}

	try {
		vueCompiler = await import('vue/compiler-sfc');
		return vueCompiler;
	} catch {
		throw new MissingPeerDependencyError('vue', 'Vue language support');
	}
}

/**
 * Vue language support.
 *
 * @remarks
 * Requires `vue` to be installed in your project.
 */
export function vue(_options: VueOptions = {}): Language {
	return {
		name: 'vue',
		canResolveDependencies: (fileName) => fileName.endsWith('.vue'),
		resolveDependencies: async (code, opts) => {
			const v = await loadVueCompiler();
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
						await getImports(script, {
							...opts,
							// weird and hacky ik but this is an easy way to get oxc to parse the code as ts
							fileName: `${opts.fileName}.ts` as AbsolutePath,
						}),
						opts
					);
				})
			);
			return {
				localDependencies: imports.flatMap((imp) => imp.localDependencies),
				dependencies: imports.flatMap((imp) => imp.dependencies),
				devDependencies: imports.flatMap((imp) => imp.devDependencies),
			};
		},
		transformImports,
		canInstallDependencies: (ecosystem) => ecosystem === 'js',
		installDependencies,
	};
}
