import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type CssOptions, css } from '@/langs/css';
import { type HtmlOptions, html } from '@/langs/html';
import { type JsOptions, js } from '@/langs/js';
import { type SvelteOptions, svelte } from '@/langs/svelte';
import type { Language } from '@/langs/types';
import { type VueOptions, vue } from '@/langs/vue';

// resolve from the user's project first, then fall back to jsrepo's own location
const projectRequire = createRequire(pathToFileURL(path.join(process.cwd(), 'package.json')));
const require = createRequire(import.meta.url);

function isModuleAvailable(moduleName: string): boolean {
	try {
		projectRequire.resolve(moduleName);
		return true;
	} catch {
		try {
			require.resolve(moduleName);
			return true;
		} catch {
			return false;
		}
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

export * from '@/langs/types';
export {
	type CssOptions,
	css,
	type HtmlOptions,
	html,
	type JsOptions,
	js,
	type SvelteOptions,
	svelte,
	type VueOptions,
	vue,
};
