import { createRequire } from 'node:module';
import { type CssOptions, css } from '@/langs/css';
import { type HtmlOptions, html } from '@/langs/html';
import { type JsOptions, js } from '@/langs/js';
import { type SvelteOptions, svelte } from '@/langs/svelte';
import type { Language } from '@/langs/types';
import { type VueOptions, vue } from '@/langs/vue';

const require = createRequire(import.meta.url);

function isModuleAvailable(moduleName: string): boolean {
	try {
		require.resolve(moduleName);
		return true;
	} catch {
		return false;
	}
}

function createDefaultLangs(): Language[] {
	const langs: Language[] = [js(), css(), html()];

	if (isModuleAvailable('svelte/compiler')) {
		langs.push(svelte());
	}

	if (isModuleAvailable('vue/compiler-sfc')) {
		langs.push(vue());
	}

	return langs;
}

export const DEFAULT_LANGS = createDefaultLangs();

export {
	js,
	type JsOptions,
	svelte,
	type SvelteOptions,
	vue,
	type VueOptions,
	css,
	type CssOptions,
	html,
	type HtmlOptions,
};
export * from '@/langs/types';
