import dedent from 'dedent';
import { describe, expect, it } from 'vitest';
import { updateConfigPaths } from '@/utils/config/mods/update-paths';

describe('updateConfigPaths', () => {
	it('should return immediately if no paths are provided', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            paths: {
                ui: './src/ui',
            },
        });
        `;

		const result = await updateConfigPaths(
			{},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(configCode);
	});

	it('should modify the config', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {},
		});
        `;

		const result = await updateConfigPaths(
			{
				ui: './src/ui',
			},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {
				ui: './src/ui'
			},
		});
`);
	});

	it('should modify the config when a function is passed', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig(() => ({
			paths: {},
		}));
        `;

		const result = await updateConfigPaths(
			{
				ui: './src/ui',
			},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig(() => ({
			paths: {
				ui: './src/ui'
			},
		}));
`);
	});

	it('should modify the config with other keys present', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			registries: ['@ieedan/std'],
			paths: {},
		});
        `;

		const result = await updateConfigPaths(
			{
				ui: './src/ui',
			},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			registries: ['@ieedan/std'],
			paths: {
				ui: './src/ui'
			},
		});
`);
	});

	it("should add the key if it doesn't exist", async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
        });
        `;

		const result = await updateConfigPaths(
			{
				ui: './src/ui',
			},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
        	paths: {
        		ui: './src/ui'
        	}
        });
`);
	});

	it('should modify existing paths without removing other paths', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {
				ui: './src/ui'
			}
		});
        `;

		const result = await updateConfigPaths(
			{
				lib: './src/lib',
			},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {
				ui: './src/ui',
				lib: './src/lib'
			}
		});
`);
	});

	it('should be able to add multiple paths at once', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {}
		});
        `;

		const result = await updateConfigPaths(
			{
				ui: './src/ui',
				lib: './src/lib',
			},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {
				ui: './src/ui',
				lib: './src/lib'
			}
		});
`);
	});

	it('should update existing path values', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            paths: {
                ui: './src/old-ui'
            }
        });
        `;

		const result = await updateConfigPaths(
			{
				ui: './src/new-ui',
			},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            paths: {
                ui: './src/new-ui'
            }
        });
        `);
	});

	it('should handle a mixture of new and existing paths', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {
				ui: './src/ui'
			}
		});
        `;

		const result = await updateConfigPaths(
			{
				ui: './src/new-ui',
				lib: './src/lib',
			},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {
				ui: './src/new-ui',
				lib: './src/lib'
			}
		});
`);
	});

	it('will add a comma if the previous key does not end with one', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			registries: []
		});
        `;

		const result = await updateConfigPaths(
			{
				ui: './src/ui',
			},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			registries: [],
			paths: {
				ui: './src/ui'
			}
		});
        `);
	});

	it('should handle paths with special characters in keys', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {}
		});
        `;

		const result = await updateConfigPaths(
			{
				'ui/button': './src/components/ui',
				'*': './src/items',
			},
			{
				config: {
					code: configCode,
					path: 'jsrepo.config.ts',
				},
			}
		);

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {
				'ui/button': './src/components/ui',
				'*': './src/items'
			}
		});
        `);
	});
});
