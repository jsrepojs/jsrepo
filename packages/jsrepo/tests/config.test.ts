import { describe, expect, it } from 'vitest';
import { resolveConfig } from '@/utils/config/resolve';
import { definePlugin } from '@/utils/plugins';
import type { Transform } from '@/utils/plugins/types';

describe('config', () => {
	it('should add default providers', () => {
		const config = resolveConfig({});
		expect(config.providers.length > 0).toBe(true);
	});

	it('should override default providers', () => {
		const config = resolveConfig({
			providers: [],
		});
		expect(config.providers.length === 0).toBe(true);
	});

	it('should add default langs', () => {
		const config = resolveConfig({});
		expect(config.languages.length > 0).toBe(true);
	});

	it('should override default langs', () => {
		const config = resolveConfig({
			languages: [],
		});
		expect(config.languages.length === 0).toBe(true);
	});

	it('should resolve plugins from the unified plugins array', () => {
		const sampleTransform: Transform = {
			transform: async ({ code }) => ({ code }),
		};
		const config = resolveConfig({
			plugins: [definePlugin({ transforms: [sampleTransform] })],
		});
		expect(config.transforms).toHaveLength(1);
	});
});
