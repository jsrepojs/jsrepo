import dedent from 'dedent';
import { describe, expect, it } from 'vitest';
import { addRegistriesToConfig } from '@/utils/config/mods/add-registries';

describe('addRegistriesToConfig', () => {
	it('should return immediately if no registries are provided', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std'],
        });
        `;

		const result = await addRegistriesToConfig([], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toEqual(configCode);
	});

	it('should modify the config', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: [],
        });
        `;

		const result = await addRegistriesToConfig(['@ieedan/std'], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std'],
        });
`);
	});

	it('should modify the config when a function is passed', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig(() => ({
            registries: [],
        }));
        `;

		const result = await addRegistriesToConfig(['@ieedan/std'], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig(() => ({
            registries: ['@ieedan/std'],
        }));
`);
	});

	it('should modify the config with other keys present', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            paths: {
                ui: './src/ui',
            },
            registries: [],
        });
        `;

		const result = await addRegistriesToConfig(['@ieedan/std'], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            paths: {
                ui: './src/ui',
            },
            registries: ['@ieedan/std'],
        });
`);
	});

	it("should add the key if it doesn't exist", async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
        });
        `;

		const result = await addRegistriesToConfig(['@ieedan/std'], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
        	registries: ['@ieedan/std']
        });
`);
	});

	it('should modify existing registries without removing other registries', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std']
        });
        `;

		const result = await addRegistriesToConfig(['@ieedan/extras'], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std', '@ieedan/extras']
        });
`);
	});

	it('should be able to add multiple registries at once', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: []
        });
        `;

		const result = await addRegistriesToConfig(['@ieedan/std', '@ieedan/extras'], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std', '@ieedan/extras']
        });
`);
	});

	it('should not re-add registries that are already added', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std']
        });
        `;

		const result = await addRegistriesToConfig(['@ieedan/std'], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toEqual(configCode);
	});

	it('should handle a mixture of added and not added registries', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std']
        });
        `;

		const result = await addRegistriesToConfig(['@ieedan/std', '@ieedan/extras'], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std', '@ieedan/extras']
        });
`);
	});

	it('will add a comma if the previous key does not end with one', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

		export default defineConfig({
			paths: {}
		});
        `;

		const result = await addRegistriesToConfig(['@ieedan/std'], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toContain('paths: {},');
		expect(result._unsafeUnwrap()).toContain('registries:');
		expect(result._unsafeUnwrap()).toContain("'@ieedan/std'");
	});

	it('should handle registries with trailing commas', async () => {
		const configCode = dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std',],
        });
        `;

		const result = await addRegistriesToConfig(['@ieedan/extras'], {
			config: {
				code: configCode,
				path: 'jsrepo.config.ts',
			},
		});

		expect(result._unsafeUnwrap()).toEqual(dedent`import { defineConfig } from 'jsrepo';

        export default defineConfig({
            registries: ['@ieedan/std', '@ieedan/extras'],
        });
`);
	});
});
