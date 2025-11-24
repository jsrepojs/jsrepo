/// <reference types="vitest/config" />
import path from 'pathe';
import { defineConfig } from 'vite';

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	test: {
		include: ['tests/**/*.test.ts', '!tests/fixtures/**/*.test.ts'],
	},
});
