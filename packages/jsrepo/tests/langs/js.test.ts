import fs from 'node:fs';
import path from 'pathe';
import { describe, expect, it, vi } from 'vitest';
import { getImports, js } from '@/langs/js';
import { joinAbsolute } from '@/utils/path';
import type { AbsolutePath, ItemRelativePath } from '@/utils/types';

const CWD = path.join(__dirname, '../fixtures/langs/js') as AbsolutePath;

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
					file: { type: 'util', path: 'button/index.ts' as ItemRelativePath },
					meta: {},
				},
				{
					import: '$lib/hooks/use-clipboard.svelte',
					item: 'use-clipboard',
					file: { type: 'util', path: 'use-clipboard.svelte.ts' as ItemRelativePath },
					meta: {},
				},
				{
					import: '$lib/utils.js',
					item: 'utils',
					file: { type: 'util', path: 'utils.ts' as ItemRelativePath },
					meta: {},
				},
				{
					import: '../../utils/math/add.js',
					item: 'math',
					file: { type: 'util', path: 'math/add.ts' as ItemRelativePath },
					meta: {},
				},
			],
			{
				cwd: CWD,
				getItemPath: (item) => {
					switch (item.item) {
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
