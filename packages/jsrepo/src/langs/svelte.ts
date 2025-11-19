import { getImports, installDependencies, resolveImports, transformImports } from '@/langs/js';
import type { Language } from '@/langs/types';
import { MissingPeerDependencyError } from '@/utils/errors';
import type { AbsolutePath } from '@/utils/types';

// biome-ignore lint/complexity/noBannedTypes: leave me alone for a minute
export type SvelteOptions = {};

let svelteCompiler: typeof import('svelte/compiler') | null = null;

async function loadSvelteCompiler() {
	if (svelteCompiler) {
		return svelteCompiler;
	}

	try {
		svelteCompiler = await import('svelte/compiler');
		return svelteCompiler;
	} catch {
		throw new MissingPeerDependencyError('svelte', 'Svelte language support');
	}
}

/**
 * Svelte language support.
 *
 * @remarks
 * Requires `svelte` to be installed in your project.
 */
export function svelte(_options: SvelteOptions = {}): Language {
	return {
		name: 'svelte',
		canResolveDependencies: (fileName) => fileName.endsWith('.svelte'),
		resolveDependencies: async (code, opts) => {
			const sv = await loadSvelteCompiler();
			const neededScripts: string[] = [];
			await sv.preprocess(code, {
				script: async ({ content }) => {
					neededScripts.push(content);
				},
			});
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
		transformImports: (code, imports, opts) => transformImports(code, imports, opts),
		canInstallDependencies: (ecosystem) => ecosystem === 'js',
		installDependencies: (deps, opts) => installDependencies(deps, opts),
	};
}
