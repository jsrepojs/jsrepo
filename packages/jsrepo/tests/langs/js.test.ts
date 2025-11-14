import fs from 'node:fs';
import path from 'pathe';
import { describe, expect, it, vi } from 'vitest';
import { getImports, js } from '@/langs/js';
import { joinAbsolute } from '@/utils/path';
import type { AbsolutePath, ItemRelativePath } from '@/utils/types';

const CWD = path.join(__dirname, '../fixtures/langs/js') as AbsolutePath;

const registryName = '@jsrepo/test';

describe('js', () => {
	it('should resolve dependencies', async () => {
		const warn = vi.fn();
		const absolutePath = joinAbsolute(CWD, 'logger.ts');
		const code = fs.readFileSync(absolutePath, 'utf-8');
		const result = await js().resolveDependencies(code, {
			fileName: absolutePath,
			cwd: CWD,
			excludeDeps: [],
			warn,
		});

		expect(result.localDependencies[0]?.import).toBe('./stdout');
		expect(result.devDependencies[0]?.name).toBe('picocolors');
		expect(result.devDependencies[0]?.version).toBe('catalog:');
	});

	it('should resolve dependencies to the correct path', async () => {
		const warn = vi.fn();
		const absolutePath = joinAbsolute(CWD, 'print-answer.ts');
		const code = fs.readFileSync(absolutePath, 'utf-8');
		const result = await js().resolveDependencies(code, {
			fileName: joinAbsolute(CWD, 'print-answer.ts'),
			cwd: CWD,
			excludeDeps: [],
			warn,
		});

		expect(result.localDependencies[0]?.import).toBe('./math/add');
		expect(result.localDependencies[1]?.import).toBe('./math/subtract');
		expect(result.localDependencies[2]?.import).toBe('./stdout');

		const addTemplate = await result.localDependencies[0]?.createTemplate({
			absolutePath: joinAbsolute(CWD, 'math/add.ts'),
			content: code,
			path: 'math/add.ts' as ItemRelativePath,
			target: undefined,
			type: 'util',
			parent: { name: 'add', type: 'util', registryName },
			dependencyResolution: 'auto',
			localDependencies: [],
			dependencies: [],
			devDependencies: [],
			manualDependencies: {
				registryDependencies: [],
				dependencies: [],
				devDependencies: [],
			},
		});
		expect(addTemplate).toEqual({ filePathRelativeToItem: 'math/add.ts' });
		const subtractTemplate = await result.localDependencies[1]?.createTemplate({
			absolutePath: joinAbsolute(CWD, 'math/subtract.ts'),
			content: code,
			path: 'math/subtract.ts' as ItemRelativePath,
			target: undefined,
			type: 'util',
			parent: { name: 'add', type: 'util', registryName },
			dependencyResolution: 'auto',
			localDependencies: [],
			dependencies: [],
			devDependencies: [],
			manualDependencies: {
				registryDependencies: [],
				dependencies: [],
				devDependencies: [],
			},
		});
		expect(subtractTemplate).toEqual({ filePathRelativeToItem: 'math/subtract.ts' });
		const stdoutTemplate = await result.localDependencies[2]?.createTemplate({
			absolutePath: joinAbsolute(CWD, 'stdout.ts'),
			type: 'util',
			target: undefined,
			content: code,
			path: 'stdout.ts' as ItemRelativePath,
			parent: { name: 'print-answer', type: 'util', registryName },
			dependencyResolution: 'auto',
			localDependencies: [],
			dependencies: [],
			devDependencies: [],
			manualDependencies: {
				registryDependencies: [],
				dependencies: [],
				devDependencies: [],
			},
		});
		expect(stdoutTemplate).toEqual({ filePathRelativeToItem: 'stdout.ts' });
	});

	it('should exclude excluded dependencies', async () => {
		const warn = vi.fn();
		const absolutePath = joinAbsolute(CWD, 'logger.ts');
		const code = fs.readFileSync(absolutePath, 'utf-8');
		const result = await js().resolveDependencies(code, {
			fileName: absolutePath,
			cwd: CWD,
			excludeDeps: ['picocolors'],
			warn,
		});

		expect(result.localDependencies[0]?.import).toBe('./stdout');
		expect(result.devDependencies[0]?.name).toBe(undefined);
		expect(result.devDependencies[0]?.version).toBe(undefined);
	});

	it('should transform imports correctly', async () => {
		const result = await js().transformImports(
			[
				{
					import: '$lib/components/ui/button',
					item: 'button',
					meta: { filePathRelativeToItem: 'button/index.ts' },
				},
				{
					import: '$lib/hooks/use-clipboard.svelte',
					item: 'use-clipboard',
					meta: { filePathRelativeToItem: 'use-clipboard.svelte.ts' },
				},
				{
					import: '$lib/utils.js',
					item: 'utils',
					meta: { filePathRelativeToItem: 'utils.ts' },
				},
				{
					import: '../../utils/math/add.js',
					item: 'math',
					meta: { filePathRelativeToItem: 'math/add.ts' },
				},
			],
			{
				cwd: CWD,
				getItemPath: (item) => {
					switch (item) {
						case 'button':
							return {
								path: 'src/lib/components/shadcn-svelte-extras/ui',
								alias: '$lib/components/shadcn-svelte-extras/ui',
							};
						case 'use-clipboard':
							return { path: 'src/lib/hooks', alias: '$lib/hooks' };
						case 'utils':
							return { path: 'src/lib', alias: '$lib' };
						case 'math':
							return {
								path: 'src/lib/utils',
								alias: '$lib/utils',
							};
						default: {
							throw new Error(`Unknown item: ${item}`);
						}
					}
				},
				targetPath: joinAbsolute(
					CWD,
					'src/lib/components/ui/copy-button/copy-button.svelte'
				),
			}
		);
		expect(result).toStrictEqual([
			{
				pattern: /(['"])\$lib\/components\/ui\/button\1/g,
				replacement: '$1$lib/components/shadcn-svelte-extras/ui/button$1',
			},
			{
				pattern: /(['"])\$lib\/hooks\/use\x2dclipboard\.svelte\1/g,
				replacement: '$1$lib/hooks/use-clipboard.svelte$1',
			},
			{
				pattern: /(['"])\$lib\/utils\.js\1/g,
				replacement: '$1$lib/utils.js$1',
			},
			{
				pattern: /(['"])\.\.\/\.\.\/utils\/math\/add\.js\1/g,
				replacement: '$1$lib/utils/math/add.js$1',
			},
		]);
	});
});

describe('getImports', () => {
	it('should get all the correct imports', async () => {
		const code = `import { add } from './math/add';
export { subtract } from './math/subtract';

const thing = import('./thing');`;
		const warn = vi.fn();
		const result = await getImports(code, {
			fileName: joinAbsolute(CWD, 'logger.ts'),
			warn,
		});

		expect(result).toStrictEqual(['./math/add', './thing', './math/subtract']);
	});

	it('should skip and warn on unresolvable dynamic imports', async () => {
		const code = `import { add } from './math/add';
export { subtract } from './math/subtract';

const thing = import('./thing');

const foo = 'bar';
const thing2 = import(\`foos/\${foo}\`);`;
		const warn = vi.fn();
		const result = await getImports(code, {
			fileName: joinAbsolute(CWD, 'logger.ts'),
			warn,
		});

		expect(result).toStrictEqual(['./math/add', './thing', './math/subtract']);
		expect(warn).toHaveBeenCalledOnce();
	});
});
