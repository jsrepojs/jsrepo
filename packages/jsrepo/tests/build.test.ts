import path from 'pathe';
import { assert, beforeAll, describe, expect, it } from 'vitest';
import { loadConfigSearch } from '@/api';
import { forEachRegistry } from '@/commands/utils';
import { type BuildResult, buildRegistry, type ResolvedItem } from '@/utils/build';
import type { AbsolutePath } from '@/utils/types';

const cwd = path.join(__dirname, './fixtures/build') as AbsolutePath;

describe('buildRegistry', () => {
	let firstRegistry: BuildResult;

	beforeAll(async () => {
		const config = await loadConfigSearch({ cwd, promptForContinueIfNull: false });
		if (config === null) throw new Error('Config not found');

		const results = await forEachRegistry(
			config.config,
			async (registry) => {
				return await buildRegistry(registry, { options: { cwd }, config: config.config });
			},
			{ cwd }
		);

		const firstRegistryResult = results[0];
		assert(firstRegistryResult !== undefined);
		firstRegistry = firstRegistryResult.match(
			(v) => v,
			(e) => {
				throw e;
			}
		);
	});

	it('should have correct registry metadata', () => {
		expect(firstRegistry.name).toBe('@jsrepo/test');
		expect(firstRegistry.authors).toStrictEqual(['Aidan Bleser']);
		expect(firstRegistry.bugs).toBe('https://github.com/jsrepojs/jsrepo/issues');
		expect(firstRegistry.description).toBe('A test registry');
		expect(firstRegistry.homepage).toBe('https://github.com/jsrepojs/jsrepo');
		expect(firstRegistry.repository).toBe('https://github.com/jsrepojs/jsrepo');
		expect(firstRegistry.tags).toStrictEqual(['test', 'registry']);
		expect(firstRegistry.version).toBe('0.0.1');
		expect(firstRegistry.defaultPaths).toStrictEqual({
			utils: './src/utils',
		});
	});

	it('should have the correct number of items', () => {
		expect(firstRegistry.items).toHaveLength(7);
	});

	describe('math item', () => {
		let mathItem: ResolvedItem;

		beforeAll(() => {
			mathItem = firstRegistry.items.find((item) => item.name === 'math')!;
			assert(mathItem !== undefined);
		});

		it('should have correct basic properties', () => {
			expect(mathItem.name).toBe('math');
			expect(mathItem.title).toBeUndefined();
			expect(mathItem.description).toBeUndefined();
			expect(mathItem.type).toBe('utils');
			expect(mathItem.add).toBe('when-added');
		});

		it('should have correct dependencies', () => {
			expect(mathItem.registryDependencies).toStrictEqual(['stdout']);
			expect(mathItem.dependencies).toStrictEqual([
				{ ecosystem: 'js', name: 'chalk', version: '^5.6.2' },
			]);
			expect(mathItem.devDependencies).toStrictEqual([]);
		});

		it('should have correct files', () => {
			expect(mathItem.files).toHaveLength(4);
			expect(mathItem.files.map((f) => f.path)).toEqual([
				'math/add.ts',
				'math/answer-format.ts',
				'math/add.test.ts',
				'math/answer-format.test.ts',
			]);
		});

		it('should detect registry imports in files', () => {
			const answerFormatFile = mathItem.files.find((f) => f.path === 'math/answer-format.ts');
			expect(answerFormatFile).toBeDefined();
			expect(answerFormatFile!._imports_).toHaveLength(1);
			expect(answerFormatFile!._imports_[0]).toMatchObject({
				import: '../stdout',
				item: 'stdout',
				meta: { filePathRelativeToItem: 'stdout.ts' },
			});
		});

		it('should detect test file type', () => {
			const addTestFile = mathItem.files.find((f) => f.path === 'math/add.test.ts');
			expect(addTestFile).toBeDefined();
			expect(addTestFile!.role).toBe('test');
			const answerFormatTestFile = mathItem.files.find(
				(f) => f.path === 'math/answer-format.test.ts'
			);
			expect(answerFormatTestFile).toBeDefined();
			expect(answerFormatTestFile!.role).toBe('test');
		});

		it('should detect dependencies in test files and separate them from the main item', () => {
			const testFile = mathItem.files.find((f) => f.path === 'math/add.test.ts');
			expect(testFile).toBeDefined();
			expect(testFile!.dependencies).toStrictEqual([
				{ ecosystem: 'js', name: 'vitest', version: undefined },
			]);
		});
	});

	describe('stdout item', () => {
		let stdoutItem: ResolvedItem;

		beforeAll(() => {
			stdoutItem = firstRegistry.items.find((item) => item.name === 'stdout')!;
			assert(stdoutItem !== undefined);
		});

		it('should have correct basic properties', () => {
			expect(stdoutItem.name).toBe('stdout');
			expect(stdoutItem.title).toBeUndefined();
			expect(stdoutItem.description).toBeUndefined();
			expect(stdoutItem.type).toBe('utils');
			expect(stdoutItem.add).toBe('when-added');
		});

		it('should have the correct dependencies', () => {
			// this also implicitly test that the utils item is properly detected
			// since utils has the same name as the utils directory it can be tricky to resolve when importing it without an extension
			expect(stdoutItem.registryDependencies).toStrictEqual(['utils']);
			expect(stdoutItem.dependencies).toStrictEqual([]);
			expect(stdoutItem.devDependencies).toStrictEqual([]);
		});

		it('should have a single file', () => {
			expect(stdoutItem.files).toHaveLength(1);
			const stdoutFile = stdoutItem.files[0];
			assert(stdoutFile !== undefined);
			expect(stdoutFile.path).toBe('stdout.ts');
		});
	});

	describe('shiki item', () => {
		let shikiItem: ResolvedItem;

		beforeAll(() => {
			shikiItem = firstRegistry.items.find((item) => item.name === 'shiki')!;
			assert(shikiItem !== undefined);
		});

		it('should have correct basic properties', () => {
			expect(shikiItem.name).toBe('shiki');
			expect(shikiItem.title).toBeUndefined();
			expect(shikiItem.description).toBeUndefined();
			expect(shikiItem.type).toBe('utils');
			expect(shikiItem.add).toBe('when-added');
		});

		it('should have correct dependencies', () => {
			expect(shikiItem.registryDependencies).toStrictEqual([]);
			expect(shikiItem.dependencies).toStrictEqual([
				{ ecosystem: 'js', name: 'shiki', version: undefined },
				// detected from dynamic imports
				{ ecosystem: 'js', name: '@shikijs/themes', version: undefined },
				{ ecosystem: 'js', name: '@shikijs/langs', version: undefined },
			]);
			expect(shikiItem.devDependencies).toStrictEqual([]);
		});

		it('should have a single file', () => {
			expect(shikiItem.files).toHaveLength(1);
			const shikiFile = shikiItem.files[0];
			assert(shikiFile !== undefined);
			expect(shikiFile.path).toBe('shiki.ts');
		});
	});

	describe('button item', () => {
		let buttonItem: ResolvedItem;

		beforeAll(() => {
			buttonItem = firstRegistry.items.find((item) => item.name === 'button')!;
			assert(buttonItem !== undefined);
		});

		it('should have correct basic properties', () => {
			expect(buttonItem.name).toBe('button');
			expect(buttonItem.title).toBe('Button');
			expect(buttonItem.description).toBe('An awesome button component');
			expect(buttonItem.type).toBe('ui');
			expect(buttonItem.add).toBe('when-added');
		});

		it('should have no dependencies', () => {
			expect(buttonItem.registryDependencies).toStrictEqual([]);
			expect(buttonItem.dependencies).toStrictEqual([]);
			expect(buttonItem.devDependencies).toStrictEqual([]);
		});

		it('should have a single file', () => {
			expect(buttonItem.files).toHaveLength(2);
			const buttonFile = buttonItem.files[0];
			assert(buttonFile !== undefined);
			expect(buttonFile.path).toBe('button.tsx');
			const exampleFile = buttonItem.files.find((f) => f.path === 'page.tsx');
			expect(exampleFile).toBeDefined();
			expect(exampleFile!.role).toBe('example');
			expect(exampleFile!.type).toBe('page');
		});
	});

	describe('counter item', () => {
		let counterItem: ResolvedItem;

		beforeAll(() => {
			counterItem = firstRegistry.items.find((item) => item.name === 'counter')!;
			assert(counterItem !== undefined);
		});

		it('should have correct basic properties', () => {
			expect(counterItem.name).toBe('counter');
			expect(counterItem.title).toBeUndefined();
			expect(counterItem.description).toBeUndefined();
			expect(counterItem.type).toBe('ui');
			expect(counterItem.add).toBe('when-added');
		});

		it('should have correct registry dependencies', () => {
			expect(counterItem.registryDependencies).toStrictEqual(['math']);
			expect(counterItem.dependencies).toStrictEqual([]);
			expect(counterItem.devDependencies).toStrictEqual([]);
		});

		it('should have a single file', () => {
			expect(counterItem.files).toHaveLength(1);
			const counterFile = counterItem.files[0];
			assert(counterFile !== undefined);
			expect(counterFile.path).toBe('counter.svelte');
		});

		it('should detect registry imports in files', () => {
			const counterFile = counterItem.files[0];
			assert(counterFile !== undefined);
			expect(counterFile._imports_).toHaveLength(1);
			expect(counterFile._imports_[0]).toMatchObject({
				import: '../../utils/math/add',
				item: 'math',
				meta: { filePathRelativeToItem: 'math/add.ts' },
			});
		});
	});

	describe('demo-page item', () => {
		let demoPageItem: ResolvedItem;

		beforeAll(() => {
			demoPageItem = firstRegistry.items.find((item) => item.name === 'demo-page')!;
			assert(demoPageItem !== undefined);
		});

		it('should have correct basic properties', () => {
			expect(demoPageItem.name).toBe('demo-page');
			expect(demoPageItem.title).toBeUndefined();
			expect(demoPageItem.description).toBeUndefined();
			expect(demoPageItem.type).toBe('page');
			expect(demoPageItem.add).toBe('when-added');
		});

		it('should have the page files', () => {
			const serverFile = demoPageItem.files.find((f) => f.path === 'demo/+page.server.ts');
			expect(serverFile).toBeDefined();
			expect(serverFile!.target).toBe('src/routes/demo/+page.server.ts');
			const clientFile = demoPageItem.files.find((f) => f.path === 'demo/+page.svelte');
			expect(clientFile).toBeDefined();
			expect(clientFile!.target).toBe('src/routes/demo/+page.svelte');
		});
	});
});
