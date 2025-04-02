import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// https://svelte.dev/docs/kit/adapter-vercel
		adapter: adapter(),
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
