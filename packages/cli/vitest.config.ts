import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		exclude: ['**/temp-test/**', 'dist/**', 'coverage/**'],
	},
	server: {
		watch: {
			ignored: ['**/temp-test/**', 'dist/**', 'coverage/**'],
		},
	},
});
