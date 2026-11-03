import { getImports, installDependencies, resolveImports, transformImports } from '@/langs/js';
import { loadPeerCompiler } from '@/langs/load-peer-compiler';
import type { Language } from '@/langs/types';
import type { AbsolutePath } from '@/utils/types';

// biome-ignore lint/complexity/noBannedTypes: leave me alone for a minute
export type VueOptions = {};

let vueCompiler: typeof import('vue/compiler-sfc') | null = null;

async function loadVueCompiler(cwd: AbsolutePath) {
	if (vueCompiler) {
		return vueCompiler;
	}

	vueCompiler = await loadPeerCompiler<typeof import('vue/compiler-sfc')>('vue/compiler-sfc', {
		cwd,
		packageName: 'vue',
		feature: 'Vue language support',
	});
	return vueCompiler;
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
			const v = await loadVueCompiler(opts.cwd);
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
