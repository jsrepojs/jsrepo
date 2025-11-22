import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/bin.ts'],
	format: ['esm'],
	alias: {
		'@/': './src/',
	},
	minify: true,
	dts: {
		sourcemap: true,
	},
});
