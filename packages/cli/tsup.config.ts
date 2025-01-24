import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/registry/index.ts'],
	format: ['esm'],
	platform: 'node',
	target: 'es2022',
	outDir: 'dist',
	clean: true,
	minify: true,
	treeshake: true,
	splitting: true,
	sourcemap: true,
	dts: true,
	banner: {
		js: '#!/usr/bin/env node',
	},
});
