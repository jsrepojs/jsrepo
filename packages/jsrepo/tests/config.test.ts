import { DEFAULT_LANGS, DEFAULT_PROVIDERS, defineConfig, type Plugin } from 'jsrepo';
import { describe, expect, it } from 'vitest';
import { runHooks } from '@/utils/hooks';

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

	describe('plugins', () => {
		const provider = { name: 'custom', matches: () => true, create: () => ({}) as never };
		const language = { name: 'custom-lang' } as never;

		it('should default to no plugins', () => {
			expect(defineConfig({}).plugins).toEqual([]);
		});

		it('should add plugin providers before the defaults', () => {
			const config = defineConfig({ plugins: [{ name: 'test', providers: [provider] }] });
			expect(config.providers).toEqual([provider, ...DEFAULT_PROVIDERS]);
		});

		it('should add plugin languages before the defaults', () => {
			const config = defineConfig({ plugins: [{ name: 'test', languages: [language] }] });
			expect(config.languages).toEqual([language, ...DEFAULT_LANGS]);
		});

		it('should add plugin providers alongside explicit providers', () => {
			const config = defineConfig({
				providers: [],
				plugins: [{ name: 'test', providers: [provider] }],
			});
			expect(config.providers).toEqual([provider]);
		});

		it('should add plugin transforms after config transforms in order', () => {
			const a = { transform: async () => ({}) };
			const b = { transform: async () => ({}) };
			const c = { transform: async () => ({}) };
			const config = defineConfig({
				transforms: [a],
				plugins: [
					{ name: 'one', transforms: [b] },
					{ name: 'two', transforms: [c] },
				],
			});
			expect(config.transforms).toEqual([a, b, c]);
		});

		it('should add plugin build transforms', () => {
			const a = { transform: async (content: string) => ({ content }) };
			const b = { transform: async (content: string) => ({ content }) };
			const config = defineConfig({
				build: { transforms: [a] },
				plugins: [{ name: 'test', build: { transforms: [b] } }],
			});
			expect(config.build.transforms).toEqual([a, b]);
		});

		it('should use the plugin remoteDependencyResolver', async () => {
			const config = defineConfig({
				plugins: [
					{
						name: 'test',
						build: {
							remoteDependencyResolver: (dep) => ({ ...dep, version: '1.0.0' }),
						},
					},
				],
			});
			const dep = { ecosystem: 'js', name: 'foo', version: 'workspace:*' };
			expect(
				await config.build.remoteDependencyResolver?.(dep, { cwd: '/' as never })
			).toEqual({ ...dep, version: '1.0.0' });
		});

		it('should run remote dependency resolvers in order', async () => {
			const config = defineConfig({
				build: {
					remoteDependencyResolver: (dep) => ({ ...dep, name: `${dep.name}-a` }),
				},
				plugins: [
					{
						name: 'one',
						build: {
							remoteDependencyResolver: (dep) => ({ ...dep, name: `${dep.name}-b` }),
						},
					},
					{
						name: 'two',
						build: {
							remoteDependencyResolver: (dep) => ({ ...dep, name: `${dep.name}-c` }),
						},
					},
				],
			});
			const dep = { ecosystem: 'js', name: 'foo' };
			expect(
				(await config.build.remoteDependencyResolver?.(dep, { cwd: '/' as never }))?.name
			).toBe('foo-a-b-c');
		});

		it('should still support onwarn', () => {
			const onwarn = () => undefined;
			expect(defineConfig({ build: { onwarn } }).build.onwarn).toBe(onwarn);
			expect(defineConfig({ onwarn }).build.onwarn).toBe(onwarn);
		});

		it('should leave hooks undefined when there are none', () => {
			expect(defineConfig({ plugins: [{ name: 'test' }] }).hooks).toBeUndefined();
		});

		it('should keep config hooks when plugins have no hooks', () => {
			const before = async () => undefined;
			const config = defineConfig({ hooks: { before }, plugins: [{ name: 'test' }] });
			expect(config.hooks).toEqual({ before });
		});

		it('should add plugin hooks after config hooks in order', () => {
			const a = async () => undefined;
			const b = async () => undefined;
			const c = async () => undefined;
			const d = 'echo done';
			const config = defineConfig({
				hooks: { before: a, after: d },
				plugins: [
					{ name: 'one', hooks: { before: [b, c] } },
					{ name: 'two', hooks: { after: a } },
				],
			});
			expect(config.hooks?.before).toEqual([a, b, c]);
			expect(config.hooks?.after).toEqual([d, a]);
		});

		it('should run plugin hooks', async () => {
			const calls: string[] = [];
			const config = defineConfig({
				hooks: {
					before: async () => {
						calls.push('config');
					},
				},
				plugins: [
					{
						name: 'test',
						hooks: {
							before: async () => {
								calls.push('plugin');
							},
						},
					},
				],
			});
			const result = await runHooks(config as never, 'before', {
				command: 'config.plugin',
				options: {} as never,
			});
			expect(result.isOk()).toBe(true);
			expect(calls).toEqual(['config', 'plugin']);
		});

		it('should throw for invalid plugins', () => {
			expect(() =>
				defineConfig({ plugins: [{ transform: () => undefined } as unknown as Plugin] })
			).toThrow('Invalid plugin');
		});

		it('should support plugins that are also legacy transforms', () => {
			const transform = async () => ({});
			const hybrid = { name: 'hybrid', transform, transforms: [{ transform }] };
			expect(defineConfig({ transforms: [hybrid] }).transforms).toEqual([hybrid]);
			expect(defineConfig({ plugins: [hybrid] }).transforms).toEqual([{ transform }]);
		});
	});
});
