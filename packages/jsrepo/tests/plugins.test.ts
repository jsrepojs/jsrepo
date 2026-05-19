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
});
