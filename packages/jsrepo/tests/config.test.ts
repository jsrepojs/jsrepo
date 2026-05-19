import { describe, expect, it } from 'vitest';
import { defineConfig } from '@/utils/config';
import type { Transform } from '@/utils/config';
import { definePlugin } from '@/utils/plugins';

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

	it('should resolve plugins from the unified plugins array', () => {
		const sampleTransform: Transform = {
			transform: async ({ code }) => ({ code }),
		};
		const config = defineConfig({
			plugins: [definePlugin({ transforms: [sampleTransform] })],
		});
		expect(config.transforms).toHaveLength(1);
	});
});
