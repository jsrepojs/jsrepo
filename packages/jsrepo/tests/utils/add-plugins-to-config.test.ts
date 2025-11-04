import dedent from 'dedent';
import { describe, expect, it } from 'vitest';
import { addPluginsToConfig, parsePluginName } from '@/utils/config/mods/add-plugins';

describe('modifyConfig', () => {
	it('should return immediately if no plugins are provided', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            transforms: [],
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'transforms',
		});

		expect(result._unsafeUnwrap()).toEqual(configCode);
	});

	it('should modify the config', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            transforms: [],
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'prettier',
					packageName: '@jsrepo/transform-prettier',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'transforms',
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';
        import prettier from '@jsrepo/transform-prettier';

        export default defineConfig({
            transforms: [prettier()],
        });
`);
	});

	it('should modify the config when a function is passed', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig(() => ({
            transforms: [],
        }));
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'prettier',
					packageName: '@jsrepo/transform-prettier',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'transforms',
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';
        import prettier from '@jsrepo/transform-prettier';

        export default defineConfig(() => ({
            transforms: [prettier()],
        }));
`);
	});

	it('should modify the config with other keys present', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std'],
            transforms: [],
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'prettier',
					packageName: '@jsrepo/transform-prettier',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'transforms',
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';
        import prettier from '@jsrepo/transform-prettier';

        export default defineConfig({
            registries: ['@ieedan/std'],
            transforms: [prettier()],
        });
`);
	});

	it("should add the key if it doesn't exist", async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'prettier',
					packageName: '@jsrepo/transform-prettier',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'transforms',
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';
        import prettier from '@jsrepo/transform-prettier';

        export default defineConfig({
        	transforms: [prettier()]
        });
`);
	});

	it('should add defaults to prevent breaking users', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'go',
					packageName: '@jsrepo/jsrepo-language-go',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'languages',
		});

		expect(
			result._unsafeUnwrap()
		).toEqual(dedent`import { defineConfig, DEFAULT_LANGS } from 'jsrepo';
        import go from '@jsrepo/jsrepo-language-go';

        export default defineConfig({
        	languages: [...DEFAULT_LANGS, go()]
        });
`);
	});

	it('should modify existing config without removing other plugins', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';
        import go from '@jsrepo/jsrepo-language-go';

        export default defineConfig({
            languages: [go()]
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'rust',
					packageName: '@jsrepo/jsrepo-language-rust',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'languages',
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';
        import go from '@jsrepo/jsrepo-language-go';
        import rust from '@jsrepo/jsrepo-language-rust';

        export default defineConfig({
            languages: [go(), rust()]
        });
`);
	});

	it('should be able to add multiple plugins at once', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            languages: []
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'go',
					packageName: '@jsrepo/jsrepo-language-go',
					version: undefined,
				},
				{
					name: 'rust',
					packageName: '@jsrepo/jsrepo-language-rust',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'languages',
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';
        import go from '@jsrepo/jsrepo-language-go';
        import rust from '@jsrepo/jsrepo-language-rust';

        export default defineConfig({
            languages: [go(), rust()]
        });
`);
	});

	it('should not re-add plugins that are already added', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';
        import go from '@jsrepo/jsrepo-language-go';

        export default defineConfig({
            languages: [go()]
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'go',
					packageName: '@jsrepo/jsrepo-language-go',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'languages',
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';
        import go from '@jsrepo/jsrepo-language-go';

        export default defineConfig({
            languages: [go()]
        });
`);
	});

	it('should handle a mixture of added and not added plugins', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';
        import go from '@jsrepo/jsrepo-language-go';

        export default defineConfig({
            languages: [go()]
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'go',
					packageName: '@jsrepo/jsrepo-language-go',
					version: undefined,
				},
				{
					name: 'rust',
					packageName: '@jsrepo/jsrepo-language-rust',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'languages',
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';
        import go from '@jsrepo/jsrepo-language-go';
        import rust from '@jsrepo/jsrepo-language-rust';

        export default defineConfig({
            languages: [go(), rust()]
        });
`);
	});

	it('should use the existing default', async () => {
		const configCode = dedent`import { defineConfig, DEFAULT_LANGS } from 'jsrepo';

        export default defineConfig({
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'go',
					packageName: '@jsrepo/jsrepo-language-go',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'languages',
		});

		expect(
			result._unsafeUnwrap()
		).toEqual(dedent`import { defineConfig, DEFAULT_LANGS } from 'jsrepo';
        import go from '@jsrepo/jsrepo-language-go';

        export default defineConfig({
        	languages: [...DEFAULT_LANGS, go()]
        });
`);
	});

	it('should use the aliased version of the default if it was aliased', async () => {
		const configCode = dedent`import { defineConfig, DEFAULT_LANGS as langs } from 'jsrepo';

        export default defineConfig({
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'go',
					packageName: '@jsrepo/jsrepo-language-go',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'languages',
		});

		expect(
			result._unsafeUnwrap()
		).toEqual(dedent`import { defineConfig, DEFAULT_LANGS as langs } from 'jsrepo';
        import go from '@jsrepo/jsrepo-language-go';

        export default defineConfig({
        	languages: [...langs, go()]
        });
`);
	});

	it('will fail if it cannot find the jsrepo import', async () => {
		const configCode = dedent`
        export default defineConfig({
        });
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'go',
					packageName: '@jsrepo/jsrepo-language-go',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'languages',
		});

		expect(result.isErr()).toBe(true);
	});

	it('will add a comma if the previous key does not end with one', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			registries: []
		});
        `;

		const result = await addPluginsToConfig({
			plugins: [
				{
					name: 'prettier',
					packageName: '@jsrepo/transform-prettier',
					version: undefined,
				},
			],
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
			key: 'transforms',
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';
		import prettier from '@jsrepo/transform-prettier';

		export default defineConfig({
			registries: [],
			transforms: [prettier()]
		});
`);
	});
});

describe('parsePluginName', () => {
	it('should parse official plugins using shorthand', () => {
		const result = parsePluginName('prettier', 'transform');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'prettier',
			packageName: '@jsrepo/transform-prettier',
			version: undefined,
		});

		const biomeResult = parsePluginName('biome', 'transform');
		expect(biomeResult._unsafeUnwrap()).toEqual({
			name: 'biome',
			packageName: '@jsrepo/transform-biome',
			version: undefined,
		});
	});

	it('should parse full package names for transform plugins', () => {
		const result = parsePluginName('jsrepo-transform-oxfmt', 'transform');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'oxfmt',
			packageName: 'jsrepo-transform-oxfmt',
			version: undefined,
		});
	});

	it('should parse scoped package names', () => {
		const result = parsePluginName('@example/jsrepo-transform-prettier', 'transform');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'prettier',
			packageName: '@example/jsrepo-transform-prettier',
			version: undefined,
		});
	});

	it('should handle camelCase conversion for multi-word plugin names', () => {
		const result = parsePluginName('jsrepo-transform-faster-prettier', 'transform');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'fasterPrettier',
			packageName: 'jsrepo-transform-faster-prettier',
			version: undefined,
		});
	});

	it('should parse provider plugins', () => {
		const result = parsePluginName('jsrepo-provider-jsr', 'provider');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'jsr',
			packageName: 'jsrepo-provider-jsr',
			version: undefined,
		});
	});

	it('should parse language plugins', () => {
		const result = parsePluginName('jsrepo-language-go', 'language');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'go',
			packageName: 'jsrepo-language-go',
			version: undefined,
		});
	});

	it('should handle scoped language plugins', () => {
		const result = parsePluginName('@example/jsrepo-language-go', 'language');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'go',
			packageName: '@example/jsrepo-language-go',
			version: undefined,
		});
	});

	it('should parse plugin with version', () => {
		const result = parsePluginName('jsrepo-transform-prettier@1.0.0', 'transform');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'prettier',
			packageName: 'jsrepo-transform-prettier',
			version: '1.0.0',
		});
	});

	it('should parse scoped plugin with version', () => {
		const result = parsePluginName('@jsrepo/transform-prettier@2.1.0', 'transform');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'prettier',
			packageName: '@jsrepo/transform-prettier',
			version: '2.1.0',
		});
	});

	it('should parse provider plugin with version', () => {
		const result = parsePluginName('jsrepo-provider-jsr@0.5.0', 'provider');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'jsr',
			packageName: 'jsrepo-provider-jsr',
			version: '0.5.0',
		});
	});

	it('should parse language plugin with version', () => {
		const result = parsePluginName('@example/jsrepo-language-go@3.2.1', 'language');
		expect(result._unsafeUnwrap()).toEqual({
			name: 'go',
			packageName: '@example/jsrepo-language-go',
			version: '3.2.1',
		});
	});
});
