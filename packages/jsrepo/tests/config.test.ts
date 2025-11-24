import { defineConfig } from 'jsrepo';
import { describe, expect, it } from 'vitest';

describe('config', () => {
	it('should add default providers', () => {
		const config = defineConfig({});
		expect(config.providers.length > 0).toBe(true);
	});

	it('should override default providers', () => {
		const config = defineConfig({
			providers: [],
		});
		expect(config.providers.length === 0).toBe(true);
	});

	it('should add default langs', () => {
		const config = defineConfig({});
		expect(config.languages.length > 0).toBe(true);
	});

	it('should override default langs', () => {
		const config = defineConfig({
			languages: [],
		});
		expect(config.languages.length === 0).toBe(true);
	});
});
