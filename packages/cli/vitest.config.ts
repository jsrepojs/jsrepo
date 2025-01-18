import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		exclude: ['**/temp-test/**', 'dist/**', 'coverage/**', 'node_modules'],
	},
	server: {
		watch: {
			ignored: ['**/temp-test/**', 'dist/**', 'coverage/**', 'node_modules'],
		},
	},
});
