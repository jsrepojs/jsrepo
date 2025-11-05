import { getImports, installDependencies, resolveImports, transformImports } from '@/langs/js';
import type { Language } from '@/langs/types';
import { MissingPeerDependencyError } from '@/utils/errors';

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
		throw new MissingPeerDependencyError(
			'svelte',
			'Svelte language support'
		);
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
