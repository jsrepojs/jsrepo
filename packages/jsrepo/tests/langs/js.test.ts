import fs from 'node:fs';
import path from 'pathe';
import { describe, expect, it, vi } from 'vitest';
import { getImports, js } from '@/langs/js';
import { joinAbsolute } from '@/utils/path';
import type { AbsolutePath, ItemRelativePath } from '@/utils/types';

const CWD = path.join(__dirname, '../fixtures/langs/js') as AbsolutePath;
const SUBPATH_IMPORTS_CWD = path.join(
	__dirname,
	'../fixtures/langs/js-subpath-imports'
) as AbsolutePath;
const BASE_URL_BARE_IMPORTS_CWD = path.join(
	__dirname,
	'../fixtures/langs/js-baseurl-bare-imports'
) as AbsolutePath;
const ARBITRARY_EXTENSIONS_CWD = path.join(
	__dirname,
	'../fixtures/langs/js-arbitrary-extensions'
) as AbsolutePath;

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

	it('should resolve dependencies using package.json subpath imports', async () => {
		const warn = vi.fn();
		const absolutePath = joinAbsolute(SUBPATH_IMPORTS_CWD, 'index.ts');
		const code = fs.readFileSync(absolutePath, 'utf-8');
		const result = await js().resolveDependencies(code, {
			fileName: absolutePath,
			cwd: SUBPATH_IMPORTS_CWD,
			excludeDeps: [],
			warn,
		});

		expect(result.localDependencies.map((dep) => dep.import)).toStrictEqual([
			'#utils/print',
			'#meta',
		]);
		expect(result.localDependencies.map((dep) => dep.fileName)).toStrictEqual([
			joinAbsolute(SUBPATH_IMPORTS_CWD, 'src/utils/print.ts'),
			joinAbsolute(SUBPATH_IMPORTS_CWD, 'src/meta.ts'),
		]);
		expect(result.dependencies).toStrictEqual([
			{
				ecosystem: 'js',
				name: 'zustand',
				version: '^5.0.0',
			},
		]);
		expect(result.devDependencies).toStrictEqual([]);
		expect(warn).not.toHaveBeenCalled();
	});

	it('should not resolve bare imports to lock files when baseUrl is set', async () => {
		const warn = vi.fn();
		const absolutePath = joinAbsolute(BASE_URL_BARE_IMPORTS_CWD, 'types.ts');
		const code = fs.readFileSync(absolutePath, 'utf-8');
		const result = await js().resolveDependencies(code, {
			fileName: absolutePath,
			cwd: BASE_URL_BARE_IMPORTS_CWD,
			excludeDeps: [],
			warn,
		});

		expect(result.localDependencies).toStrictEqual([]);
		expect(result.dependencies).toStrictEqual([
			{
				ecosystem: 'js',
				name: 'bun',
				version: '^1.0.0',
			},
		]);
		expect(result.devDependencies).toStrictEqual([]);
		expect(warn).not.toHaveBeenCalled();
	});

	it('should resolve extensionless local imports to json files', async () => {
		const warn = vi.fn();
		const absolutePath = joinAbsolute(ARBITRARY_EXTENSIONS_CWD, 'index.ts');
		const code = fs.readFileSync(absolutePath, 'utf-8');
		const result = await js().resolveDependencies(code, {
			fileName: absolutePath,
			cwd: ARBITRARY_EXTENSIONS_CWD,
			excludeDeps: [],
			warn,
		});

		expect(result.localDependencies.map((dep) => dep.import)).toStrictEqual(['./config']);
		expect(result.localDependencies.map((dep) => dep.fileName)).toStrictEqual([
			joinAbsolute(ARBITRARY_EXTENSIONS_CWD, 'config.json'),
		]);
		expect(result.dependencies).toStrictEqual([]);
		expect(result.devDependencies).toStrictEqual([]);
		expect(warn).not.toHaveBeenCalled();
	});

	it('should resolve extensionless local imports to svelte files', async () => {
		const warn = vi.fn();
		const absolutePath = joinAbsolute(ARBITRARY_EXTENSIONS_CWD, 'svelte-entry.ts');
		const code = fs.readFileSync(absolutePath, 'utf-8');
		const result = await js().resolveDependencies(code, {
			fileName: absolutePath,
			cwd: ARBITRARY_EXTENSIONS_CWD,
			excludeDeps: [],
			warn,
		});

		expect(result.localDependencies.map((dep) => dep.import)).toStrictEqual(['./component']);
		expect(result.localDependencies.map((dep) => dep.fileName)).toStrictEqual([
			joinAbsolute(ARBITRARY_EXTENSIONS_CWD, 'component.svelte'),
		]);
		expect(result.dependencies).toStrictEqual([]);
		expect(result.devDependencies).toStrictEqual([]);
		expect(warn).not.toHaveBeenCalled();
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
			`import { button } from '$lib/components/ui/button';
import { useClipboard } from '$lib/hooks/use-clipboard.svelte';
import { utils } from '$lib/utils.js';
import { add } from '../../utils/math/add.js';
import { Separator } from '@/registry/new-york-v4/ui/separator';
import foo from './foo.js';
import bar from './bar';
import nestedFoo from './nested/foo.js';
import nestedBar from './nested/bar';`,
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
				{
					import: './foo.js',
					item: 'foo',
					file: { type: 'util', path: 'Foo.ts' as ItemRelativePath },
					meta: {},
				},
				{
					import: './bar',
					item: 'bar',
					file: { type: 'util', path: 'Bar.ts' as ItemRelativePath },
					meta: {},
				},
				{
					import: './nested/foo.js',
					item: 'nestedFoo',
					file: { type: 'util', path: 'Nested/Foo.ts' as ItemRelativePath },
					meta: {},
				},
				{
					import: './nested/bar',
					item: 'nestedBar',
					file: { type: 'util', path: 'Nested/Bar.ts' as ItemRelativePath },
					meta: {},
				},
			],
			{
				cwd: CWD,
				item: 'button',
				file: { type: 'util', path: 'button/index.ts' as ItemRelativePath },
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
						case 'foo':
							return { path: 'src/lib/utils', alias: '$lib/utils' };
						case 'bar':
							return { path: 'src/lib/utils', alias: '$lib/utils' };
						case 'nestedFoo':
							return { path: 'src/lib/utils', alias: '$lib/utils' };
						case 'nestedBar':
							return { path: 'src/lib/utils', alias: '$lib/utils' };
						default: {
							if (item.file.type === 'ui')
								return { path: 'src/components/ui', alias: '@/components/ui' };
							if (item.file.type === 'component')
								return { path: 'src/components', alias: '@/components' };
							throw new Error(`Unknown item: ${item}`);
						}
					}
				},
				targetPath: joinAbsolute(CWD, 'src/lib/components/ui/copy-button/copy-button.tsx'),
			}
		);
		expect(
			result
		).toStrictEqual(`import { button } from '$lib/components/shadcn-svelte-extras/ui/button';
import { useClipboard } from '$lib/hooks/use-clipboard.svelte';
import { utils } from '$lib/utils.js';
import { add } from '$lib/utils/math/add.js';
import { Separator } from '@/components/ui/separator';
import foo from '$lib/utils/Foo.js';
import bar from '$lib/utils/Bar';
import nestedFoo from '$lib/utils/Nested/Foo.js';
import nestedBar from '$lib/utils/Nested/Bar';`);
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

	it('should treat backticks as resolvable so long as they are literals', async () => {
		const code = `import { add } from './math/add';
export { subtract } from './math/subtract';

const thing = import('./thing');

const foo = 'bar';
const thing2 = import(\`./foo\`);`;
		const warn = vi.fn();
		const result = await getImports(code, {
			fileName: joinAbsolute(CWD, 'logger.ts'),
			warn,
		});

		expect(result).toStrictEqual(['./math/add', './thing', './foo', './math/subtract']);
		expect(warn).toHaveBeenCalledTimes(0);
	});
});
