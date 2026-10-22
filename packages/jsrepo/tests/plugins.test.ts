import { describe, expect, it } from 'vitest';
import { resolveConfig } from '@/utils/config/resolve';
import { definePlugin } from '@/utils/plugins';
import type { Transform } from '@/utils/plugins/types';
import { resolvePluginContributions, resolvePluginContributionsList } from '@/utils/plugins/normalize';

const sampleTransform: Transform = {
	transform: async ({ code }) => ({ code }),
};

describe('plugins', () => {
	it('should resolve a transform plugin contribution', () => {
		const contributions = resolvePluginContributions(sampleTransform);
		expect(contributions.transforms).toHaveLength(1);
	});

	it('should resolve a unified plugin object', () => {
		const contributions = resolvePluginContributions(
			definePlugin({
				transforms: [sampleTransform],
			})
		);
		expect(contributions.transforms).toHaveLength(1);
	});

	it('should unwrap transforms passed in the legacy transforms array', () => {
		const config = resolveConfig({
			transforms: [
				definePlugin({
					transforms: [sampleTransform],
				}),
			],
		});
		expect(config.transforms).toHaveLength(1);
	});

	it('should merge plugins with legacy fields', () => {
		const config = resolveConfig({
			plugins: [
				definePlugin({
					transforms: [sampleTransform],
				}),
			],
			transforms: [sampleTransform],
		});
		expect(config.transforms).toHaveLength(2);
	});

	it('should resolve build contributions from plugins', () => {
		const resolver = async () => ({ ecosystem: 'js', name: 'foo' });
		const contributions = resolvePluginContributionsList([
			definePlugin({
				build: {
					remoteDependencyResolver: resolver,
				},
			}),
		]);
		expect(contributions.build.remoteDependencyResolver).toBe(resolver);
	});

	it('should apply plugins through resolveConfig', () => {
		const config = resolveConfig({
			plugins: [
				definePlugin({
					transforms: [sampleTransform],
				}),
			],
		});
		expect(config.transforms).toHaveLength(1);
	});

	it('should merge hooks from plugins and config', () => {
		const pluginBefore = async () => {};
		const configBefore = async () => {};
		const pluginAfter = 'plugin-after';
		const configAfter = 'config-after';

		const config = resolveConfig({
			plugins: [
				definePlugin({
					hooks: {
						before: pluginBefore,
						after: pluginAfter,
					},
				}),
			],
			hooks: {
				before: configBefore,
				after: configAfter,
			},
		});

		expect(Array.isArray(config.hooks?.before)).toBe(true);
		expect((config.hooks?.before as unknown[]).length).toBe(2);
		expect((config.hooks?.before as unknown[])[0]).toBe(pluginBefore);
		expect((config.hooks?.before as unknown[])[1]).toBe(configBefore);

		expect(Array.isArray(config.hooks?.after)).toBe(true);
		expect((config.hooks?.after as unknown[]).length).toBe(2);
		expect((config.hooks?.after as unknown[])[0]).toBe(pluginAfter);
		expect((config.hooks?.after as unknown[])[1]).toBe(configAfter);
	});

	it('should merge hooks from multiple plugins in order', () => {
		const first = async () => {};
		const second = async () => {};

		const config = resolveConfig({
			plugins: [
				definePlugin({ hooks: { before: first } }),
				definePlugin({ hooks: { before: second } }),
			],
		});

		expect((config.hooks?.before as unknown[])[0]).toBe(first);
		expect((config.hooks?.before as unknown[])[1]).toBe(second);
	});
});
