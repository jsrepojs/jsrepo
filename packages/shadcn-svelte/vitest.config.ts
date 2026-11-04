import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// the fixtures contain test files that are part of the registries we build
		include: ['tests/*.test.ts'],
	},
});
