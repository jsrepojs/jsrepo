import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/api/index.ts'],
	format: ['esm'],
	platform: 'node',
	target: 'es2022',
	outDir: 'dist',
	clean: true,
	minify: true,
	treeshake: true,
	splitting: true,
});
