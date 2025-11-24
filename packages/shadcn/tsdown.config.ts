import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts', 'src/output.ts', 'src/provider.ts'],
	format: ['esm'],
	minify: true,
	dts: {
		sourcemap: true,
	},
});
