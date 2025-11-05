import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts', 'src/output.ts'],
	format: ['esm'],
});
