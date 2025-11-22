import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: [
		'src/bin.ts',
		'src/api/index.ts',
		'src/api/providers.ts',
		'src/api/langs/index.ts',
		'src/api/langs/js.ts',
		'src/api/outputs.ts',
		'src/api/config.ts',
		'src/api/errors.ts',
		'src/api/utils.ts',
	],
	format: ['esm'],
	alias: {
		'@/': './src/',
	},
	minify: true,
	dts: {
		sourcemap: true,
	},
});
