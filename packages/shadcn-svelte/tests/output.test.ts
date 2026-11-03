import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { output } from '../src/output';

type TestFile = {
	path?: string;
	content?: string;
	type?: string;
	role?: string;
	target?: string;
};

type TestItem = {
	name: string;
	type?: string;
	title?: string;
	description?: string;
	files?: TestFile[];
	registryDependencies?: string[];
	dependencies?: { ecosystem: string; name: string; version?: string }[];
	devDependencies?: { ecosystem: string; name: string; version?: string }[];
	categories?: string[];
	meta?: Record<string, string>;
};

let cwd: string;

beforeEach(() => {
	cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'jsrepo-shadcn-svelte-'));
});

afterEach(() => {
	fs.rmSync(cwd, { recursive: true, force: true });
});

function buildResult(items: TestItem[], overrides: Record<string, unknown> = {}) {
	return {
		name: '@test/registry',
		homepage: 'https://example.com',
		items: items.map((item) => ({
			title: undefined,
			description: undefined,
			registryDependencies: undefined,
			dependencies: undefined,
			devDependencies: undefined,
			add: 'when-added',
			envVars: undefined,
			categories: undefined,
			meta: undefined,
			type: 'ui',
			...item,
			files: (item.files ?? [{}]).map((file) => ({
				absolutePath: path.join(cwd, file.path ?? `${item.name}.svelte`),
				path: file.path ?? `${item.name}.svelte`,
				content: '',
				type: item.type ?? 'ui',
				role: 'file',
				_imports_: [],
				registryDependencies: undefined,
				dependencies: undefined,
				devDependencies: undefined,
				...file,
			})),
		})),
		...overrides,
		// biome-ignore lint/suspicious/noExplicitAny: partial test data
	} as any;
}

async function run(
	items: TestItem[],
	options: Partial<Parameters<typeof output>[0]> = {},
	overrides: Record<string, unknown> = {}
) {
	await output({ dir: 'out', ...options }).output(buildResult(items, overrides), {
		cwd,
		// biome-ignore lint/suspicious/noExplicitAny: only cwd is used
	} as any);
}

// biome-ignore lint/suspicious/noExplicitAny: reading arbitrary json in tests
function read<T = Record<string, any>>(file: string): T {
	return JSON.parse(fs.readFileSync(path.join(cwd, 'out', file), 'utf-8'));
}

describe('output', () => {
	it('should write an index and an item file for each item', async () => {
		await run([{ name: 'a' }, { name: 'b', title: 'B', description: 'The b item' }]);

		expect(fs.readdirSync(path.join(cwd, 'out')).toSorted()).toStrictEqual([
			'a.json',
			'b.json',
			'index.json',
		]);

		expect(read('index.json')).toStrictEqual([
			{ name: 'a', type: 'registry:ui', registryDependencies: [], relativeUrl: 'a.json' },
			{
				name: 'b',
				title: 'B',
				type: 'registry:ui',
				description: 'The b item',
				registryDependencies: [],
				relativeUrl: 'b.json',
			},
		]);
		expect(read('b.json')).toMatchObject({
			$schema: 'https://shadcn-svelte.com/schema/registry-item.json',
			name: 'b',
			title: 'B',
			description: 'The b item',
			type: 'registry:ui',
		});
	});

	it('should default to tab formatting and allow it to be configured', async () => {
		await run([{ name: 'a' }]);
		expect(fs.readFileSync(path.join(cwd, 'out', 'a.json'), 'utf-8')).toContain('\n\t"name"');

		await run([{ name: 'a' }], { format: { space: '  ' } });
		expect(fs.readFileSync(path.join(cwd, 'out', 'a.json'), 'utf-8')).toContain('\n  "name"');

		await run([{ name: 'a' }], { format: false });
		expect(fs.readFileSync(path.join(cwd, 'out', 'a.json'), 'utf-8')).not.toContain('\n');
	});

	it('should remove the output directory on clean', async () => {
		await run([{ name: 'a' }]);
		await output({ dir: 'out' }).clean({ cwd } as never);
		expect(fs.existsSync(path.join(cwd, 'out'))).toBe(false);
	});

	describe('types', () => {
		it('should add the registry: prefix', async () => {
			await run([
				{ name: 'a', type: 'hook' },
				{ name: 'b', type: 'registry:lib' },
				{ name: 'c', type: undefined, files: [{ type: undefined }] },
			]);
			expect(read('a.json').type).toBe('registry:hook');
			expect(read('a.json').files[0].type).toBe('registry:hook');
			expect(read('b.json').type).toBe('registry:lib');
			expect(read('c.json').type).toBe('registry:ui');
		});

		it('should remap types with typeMap', async () => {
			await run([{ name: 'a', type: 'util' }], { typeMap: { util: 'registry:lib' } });
			expect(read('a.json').type).toBe('registry:lib');
			expect(read('a.json').files[0].type).toBe('registry:lib');
		});

		it('should reject unknown types', async () => {
			await expect(run([{ name: 'a', type: 'util' }])).rejects.toThrow(
				/Invalid type: registry:util/
			);
		});

		it.each(['registry:base', 'registry:font'])('should reject %s', async (type) => {
			await expect(run([{ name: 'a', type }])).rejects.toThrow(
				/cannot be added to the registry/
			);
		});
	});

	describe('aliases', () => {
		const content = [
			"import { Button } from '$lib/components/ui/button/index.js';",
			"import Card from '$lib/components/card.svelte';",
			"import { useThing } from '$lib/hooks/use-thing.svelte.js';",
			"import { cn } from '$lib/utils.js';",
			"import { other } from '$lib/other.js';",
		].join('\n');

		it('should replace aliases with placeholders', async () => {
			await run([{ name: 'a', files: [{ content }] }], {
				aliases: {
					lib: '$lib',
					ui: '$lib/components/ui',
					components: '$lib/components',
					utils: '$lib/utils',
					hooks: '$lib/hooks',
				},
			});
			expect(read('a.json').files[0].content.split('\n')).toStrictEqual([
				"import { Button } from '$COMPONENTS$/ui/button/index.js';",
				"import Card from '$COMPONENTS$/card.svelte';",
				"import { useThing } from '$HOOKS$/use-thing.svelte.js';",
				"import { cn } from '$UTILS$.js';",
				"import { other } from '$LIB$/other.js';",
			]);
		});

		it('should fall back to the defaults used by the shadcn-svelte CLI', async () => {
			await run([
				{
					name: 'a',
					files: [
						{
							content:
								"import { Button } from '$lib/registry/ui/button';\nimport { cn } from '$lib/utils';",
						},
					],
				},
			]);
			expect(read('a.json').files[0].content).toBe(
				"import { Button } from '$UI$/button';\nimport { cn } from '$UTILS$';"
			);
		});
	});

	describe('targets', () => {
		it('should use the path relative to the item by default', async () => {
			await run([
				{
					name: 'a',
					files: [
						{ path: 'a/index.ts' },
						{ path: 'a/nested/b.svelte' },
						{ path: 'c.ts' },
					],
				},
			]);
			expect(
				read('a.json').files.map((file: { target: string }) => file.target)
			).toStrictEqual(['a/index.ts', 'a/nested/b.svelte', 'c.ts']);
		});

		it('should make targets inside of the alias relative to the alias', async () => {
			await run(
				[
					{
						name: 'a',
						type: 'component',
						files: [{ path: 'a.svelte', target: '$lib/components/bits/a.svelte' }],
					},
				],
				{ aliases: { components: '$lib/components' } }
			);
			expect(read('a.json').files[0].target).toBe('bits/a.svelte');
		});

		it('should resolve targets using the alias for the type of the file', async () => {
			await run(
				[
					{
						name: 'ui',
						type: 'ui',
						files: [{ target: '$lib/components/ui/x/ui.svelte' }],
					},
					{
						name: 'hook',
						type: 'hook',
						files: [{ target: '$lib/hooks/hook.svelte.ts' }],
					},
					{ name: 'lib', type: 'lib', files: [{ target: '$lib/lib.ts' }] },
					{
						name: 'block',
						type: 'block',
						files: [{ target: '$lib/blocks/block.svelte' }],
					},
				],
				{
					aliases: {
						lib: '$lib',
						ui: '$lib/components/ui',
						components: '$lib/blocks',
						hooks: '$lib/hooks',
					},
				}
			);
			expect(read('ui.json').files[0].target).toBe('x/ui.svelte');
			expect(read('hook.json').files[0].target).toBe('hook.svelte.ts');
			expect(read('lib.json').files[0].target).toBe('lib.ts');
			expect(read('block.json').files[0].target).toBe('block.svelte');
		});

		it('should pass through targets relative to the project root', async () => {
			await run([
				{ name: 'a', type: 'component', files: [{ target: '~/src/lib/other/a.svelte' }] },
			]);
			expect(read('a.json').files[0].target).toBe('~/src/lib/other/a.svelte');
		});

		it('should error when the target is outside of the alias', async () => {
			await expect(
				run(
					[
						{
							name: 'a',
							type: 'component',
							files: [{ target: '$lib/elsewhere/a.svelte' }],
						},
					],
					{ aliases: { components: '$lib/components' } }
				)
			).rejects.toThrow(/outside of the `components` alias \(\$lib\/components\)/);
		});

		it.each(['file', 'page'])('should require a target for registry:%s', async (type) => {
			await expect(run([{ name: 'a', type }])).rejects.toThrow(
				new RegExp(`Target is required for registry items with type registry:${type}`)
			);
		});

		it.each([
			['file', '~/.env.example'],
			['page', 'dashboard/+page.svelte'],
		])('should pass through targets for registry:%s as is', async (type, target) => {
			await run([{ name: 'a', type, files: [{ target }] }]);
			expect(read('a.json').files[0].target).toBe(target);
		});
	});

	describe('files', () => {
		it('should skip example, doc and test files', async () => {
			await run([
				{
					name: 'a',
					files: [
						{ path: 'a.svelte' },
						{ path: 'a.example.svelte', role: 'example' },
						{ path: 'a.md', role: 'doc' },
						{ path: 'a.test.ts', role: 'test' },
					],
				},
			]);
			expect(read('a.json').files).toHaveLength(1);
			expect(read('a.json').files[0].target).toBe('a.svelte');
		});

		it('should not output items that only have files that cannot be installed', async () => {
			await run([
				{ name: 'a' },
				{ name: 'examples', files: [{ path: 'x.svelte', role: 'example' }] },
			]);
			expect(fs.existsSync(path.join(cwd, 'out', 'examples.json'))).toBe(false);
			expect(read('index.json').map((item: { name: string }) => item.name)).toStrictEqual([
				'a',
			]);
		});

		it('should error when an item depends on an item that was not output', async () => {
			await expect(
				run([
					{ name: 'a', registryDependencies: ['examples'] },
					{ name: 'examples', files: [{ path: 'x.svelte', role: 'example' }] },
				])
			).rejects.toThrow(
				/depends on examples but examples has no files that can be installed/
			);
		});

		it('should not allow an item named index', async () => {
			await expect(run([{ name: 'index' }])).rejects.toThrow(/item named "index"/);
		});
	});

	describe('dependencies', () => {
		it('should make dependencies between items relative urls', async () => {
			await run([
				{ name: 'a', registryDependencies: ['b', 'https://example.com/r/c.json', 'd'] },
				{ name: 'b' },
			]);
			// d isn't part of this registry so it's up to shadcn-svelte to resolve it
			expect(read('a.json').registryDependencies).toStrictEqual([
				'./b.json',
				'https://example.com/r/c.json',
				'd',
			]);
			expect(read('index.json')[0].registryDependencies).toStrictEqual([
				'./b.json',
				'https://example.com/r/c.json',
				'd',
			]);
		});

		it('should omit empty registryDependencies from items like the shadcn-svelte CLI', async () => {
			await run([{ name: 'a', registryDependencies: [] }]);
			expect(read('a.json')).not.toHaveProperty('registryDependencies');
		});

		it('should format dependencies and devDependencies', async () => {
			await run([
				{
					name: 'a',
					dependencies: [
						{ ecosystem: 'js', name: 'clsx', version: '^2.1.1' },
						{ ecosystem: 'js', name: 'ogl' },
					],
					devDependencies: [{ ecosystem: 'js', name: '@types/node', version: '^25.0.0' }],
				},
			]);
			expect(read('a.json').dependencies).toStrictEqual(['clsx@^2.1.1', 'ogl']);
			expect(read('a.json').devDependencies).toStrictEqual(['@types/node@^25.0.0']);
		});

		it('should dedupe dependencies preferring the one with a version', async () => {
			await run([
				{
					name: 'a',
					dependencies: [
						{ ecosystem: 'js', name: 'ogl' },
						{ ecosystem: 'js', name: 'ogl', version: '^1.0.11' },
					],
				},
			]);
			expect(read('a.json').dependencies).toStrictEqual(['ogl@^1.0.11']);
		});

		it('should ignore dependencies that are not from npm', async () => {
			await run([{ name: 'a', dependencies: [{ ecosystem: 'python', name: 'numpy' }] }]);
			expect(read('a.json')).not.toHaveProperty('dependencies');
		});
	});

	it('should include categories and meta', async () => {
		await run([
			{ name: 'a', categories: ['backgrounds'], meta: { documentation: 'https://x.dev' } },
		]);
		expect(read('a.json').categories).toStrictEqual(['backgrounds']);
		expect(read('a.json').meta).toStrictEqual({ documentation: 'https://x.dev' });
		expect(read('index.json')[0].meta).toStrictEqual({ documentation: 'https://x.dev' });
	});
});
