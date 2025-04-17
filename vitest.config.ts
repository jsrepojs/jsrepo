import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		// sometimes they take a while so we'll do this to prevent them from being flakey
		testTimeout: 10000,
		exclude: ['**/temp-test/**', 'dist/**', 'coverage/**', 'node_modules'],
	},
	server: {
		watch: {
			ignored: ['**/temp-test/**', 'dist/**', 'coverage/**', 'node_modules'],
		},
	},
});
