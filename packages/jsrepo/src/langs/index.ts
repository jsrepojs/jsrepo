import { type CssOptions, css } from '@/langs/css';
import { type HtmlOptions, html } from '@/langs/html';
import { type JsOptions, js } from '@/langs/js';
import { type SvelteOptions, svelte } from '@/langs/svelte';
import { type VueOptions, vue } from '@/langs/vue';

export const DEFAULT_LANGS = [js(), svelte(), vue(), css(), html()];

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
