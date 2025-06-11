import fs from 'node:fs';
import path from 'pathe';
import { assert, afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cli } from '../src/cli';
import type { Manifest } from '../src/types';
import {
	shouldIncludeBlock,
	shouldIncludeCategory,
	shouldListBlock,
	shouldListCategory,
} from '../src/utils/build';
import type { RegistryConfig } from '../src/utils/config';
import { parseManifest } from '../src/utils/manifest';
import { assertFilesExist } from './utils';

describe('build', () => {
	const testDir = path.join(__dirname, '../temp-test/build');

	beforeAll(async () => {
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, { recursive: true });
		}

		fs.mkdirSync(testDir, { recursive: true });
		// cd into testDir
		process.chdir(testDir);
	});

	afterAll(() => {
		process.chdir(__dirname); // unlock directory

		// fs.rmSync(testDir, { recursive: true });
	});

	it('builds local and remote dependencies', async () => {
		// create package.json
		const pkg = {
			name: 'registry',
			dependencies: {
				chalk: '^5.3.0',
				valibot: '1.0.0-beta.14',
			},
		};

		fs.writeFileSync('package.json', JSON.stringify(pkg));

		const buildConfig: RegistryConfig = {
			$schema: '',
			meta: {
				authors: ['Aidan Bleser'],
			},
			readme: 'README',
			configFiles: [
				{
					name: 'Global CSS File',
					path: './app.css',
					optional: false,
				},
				{
					name: 'Hooks',
					path: './src/hooks.ts',
					optional: true,
				},
			],
			dirs: ['./src', './'],
			includeBlocks: [],
			includeCategories: [],
			excludeBlocks: [],
			excludeCategories: ['src'],
			doNotListBlocks: ['noop'],
			doNotListCategories: [],
			listBlocks: [],
			listCategories: [],
			excludeDeps: [],
			allowSubdirectories: true,
			includeDocs: true,
		};

		fs.writeFileSync('jsrepo-build-config.json', JSON.stringify(buildConfig));

		const tsConfig = {
			compilerOptions: {
				esModuleInterop: true,
				forceConsistentCasingInFileNames: true,
				isolatedModules: true,
				moduleResolution: 'Bundler',
				module: 'ES2022',
				target: 'ES2022',
				skipLibCheck: true,
				strict: true,
				paths: {
					'$types/*': ['./src/types/*'],
				},
			},
			include: ['src/**/*.ts'],
		};

		fs.writeFileSync('tsconfig.json', JSON.stringify(tsConfig));

		fs.writeFileSync(
			'.gitignore',
			`ignored
/.ignored/`
		);

		fs.mkdirSync('./src/utils', { recursive: true });
		fs.mkdirSync('./src/ts', { recursive: true });
		fs.mkdirSync('./src/svelte', { recursive: true });

		fs.mkdirSync('./ignored/', { recursive: true });
		fs.mkdirSync('./.ignored/', { recursive: true });

		fs.writeFileSync('./ignored/b.ts', '');
		fs.writeFileSync('./.ignored/a.ts', '');

		fs.writeFileSync('./app.css', '');
		fs.writeFileSync('./src/hooks.ts', 'import { x } from "lodash"');

		fs.mkdirSync('./src/types', { recursive: true });

		fs.mkdirSync('./src/utils/form1/server', { recursive: true });
		fs.mkdirSync('./src/utils/form1/client', { recursive: true });

		fs.writeFileSync(
			'./src/utils/form1/server/index.ts',
			`import { schema } from '../types';
export const action = () => {}`
		);
		fs.writeFileSync('./src/utils/form1/client/form.svelte', '<form>test</form>');
		fs.writeFileSync(
			'./src/utils/form1/types.ts',
			`import * as v from 'valibot';

export const schema = v.object({});`
		);

		fs.writeFileSync('./src/utils/noop.ts', '');

		fs.writeFileSync(
			'./src/utils/add.ts',
			`import { log } from "./log";

export const add = (a: number, b: number) => a b;

export const logAnswer = (a: number, b: number) => log(\`Answer is: \${add(a, b)}\`);`
		);

		fs.writeFileSync(
			'./src/utils/add.md',
			`# Add

This is a test`
		);

		fs.writeFileSync(
			'./src/utils/log.ts',
			`import color from "chalk";
            
export const log = (msg: string) => console.info(color.cyan(msg));`
		);

		fs.writeFileSync(
			'./src/utils/math.ts',
			`import type { Point } from "$types/point.js";

export const createPoint = (x: number, y: number): Point => { x, y };`
		);

		fs.writeFileSync('./src/types/point.ts', 'export type Point = { x: number; y: number; };');

		fs.writeFileSync(
			'./src/ts/dynamic-imports.ts',
			`import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { createHighlighterCore } from 'shiki/core';

/** A preloaded highlighter instance. */
export const highlighter = createHighlighterCore({
	themes: [
		import('@shikijs/themes/github-light-default'),
		import('@shikijs/themes/github-dark-default')
	],
	langs: [
		import('@shikijs/langs/bash')
	],
	engine: createJavaScriptRegexEngine()
});`
		);

		fs.writeFileSync(
			'./src/svelte/dynamic-imports.svelte',
			`<script lang="ts">
	import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
	import { createHighlighterCore } from 'shiki/core';

	/** A preloaded highlighter instance. */
	export const highlighter = createHighlighterCore({
		themes: [
			import('@shikijs/themes/github-light-default'),
			import('@shikijs/themes/github-dark-default')
		],
		langs: [
			import('@shikijs/langs/bash')
		],
		engine: createJavaScriptRegexEngine()
	});
</script>`
		);

		// build

		await cli.parseAsync([
			'node',
			'jsrepo',
			'build',
			'--cwd',
			testDir,
			'--output-dir',
			'./registry',
		]);

		const manifest = parseManifest(
			fs.readFileSync('./registry/jsrepo-manifest.json').toString()
		);

		assert(manifest.isOk());

		expect(manifest.unwrap()).toStrictEqual({
			meta: {
				authors: ['Aidan Bleser'],
			},
			configFiles: [
				{
					name: 'Global CSS File',
					path: './app.css',
					optional: false,
					dependencies: [],
					devDependencies: [],
				},
				{
					name: 'Hooks',
					path: './src/hooks.ts',
					optional: true,
					dependencies: ['lodash'],
					devDependencies: [],
				},
			],
			categories: [
				{
					name: 'svelte',
					blocks: [
						{
							name: 'dynamic-imports',
							category: 'svelte',
							localDependencies: [],
							dependencies: ['shiki', '@shikijs/themes', '@shikijs/langs'],
							devDependencies: [],
							tests: false,
							docs: false,
							list: true,
							directory: 'src/svelte',
							subdirectory: false,
							files: ['dynamic-imports.svelte'],
							_imports_: {},
						},
					],
				},
				{
					name: 'ts',
					blocks: [
						{
							name: 'dynamic-imports',
							category: 'ts',
							localDependencies: [],
							dependencies: ['shiki', '@shikijs/themes', '@shikijs/langs'],
							devDependencies: [],
							tests: false,
							docs: false,
							list: true,
							directory: 'src/ts',
							subdirectory: false,
							files: ['dynamic-imports.ts'],
							_imports_: {},
						},
					],
				},
				{
					name: 'types',
					blocks: [
						{
							name: 'point',
							category: 'types',
							localDependencies: [],
							dependencies: [],
							devDependencies: [],
							tests: false,
							docs: false,
							list: true,
							directory: 'src/types',
							subdirectory: false,
							files: ['point.ts'],
							_imports_: {},
						},
					],
				},
				{
					name: 'utils',
					blocks: [
						{
							name: 'add',
							category: 'utils',
							localDependencies: ['utils/log'],
							dependencies: [],
							devDependencies: [],
							tests: false,
							docs: true,
							list: true,
							directory: 'src/utils',
							subdirectory: false,
							files: ['add.ts', 'add.md'],
							_imports_: {
								'./log': '{{utils/log}}',
							},
						},
						{
							name: 'form1',
							category: 'utils',
							localDependencies: [],
							dependencies: ['valibot@1.0.0-beta.14'],
							devDependencies: [],
							tests: false,
							docs: false,
							list: true,
							directory: 'src/utils/form1',
							subdirectory: true,
							files: ['client/form.svelte', 'server/index.ts', 'types.ts'],
							_imports_: {},
						},
						{
							name: 'log',
							category: 'utils',
							localDependencies: [],
							dependencies: ['chalk@^5.3.0'],
							devDependencies: [],
							tests: false,
							docs: false,
							list: true,
							directory: 'src/utils',
							subdirectory: false,
							files: ['log.ts'],
							_imports_: {},
						},
						{
							name: 'math',
							category: 'utils',
							localDependencies: ['types/point'],
							dependencies: [],
							devDependencies: [],
							tests: false,
							docs: false,
							list: true,
							directory: 'src/utils',
							subdirectory: false,
							files: ['math.ts'],
							_imports_: {
								'$types/point.js': '{{types/point}}.js',
							},
						},
					],
				},
			],
		} satisfies Manifest);

		// ensure files were copied correctly
		assertFilesExist('./registry/src/utils', 'add.ts', 'log.ts', 'math.ts');
		assertFilesExist(
			'./registry/src/utils/form1',
			'types.ts',
			'./client/form.svelte',
			'./server/index.ts'
		);
		assertFilesExist('./registry/src/types', 'point.ts');
		assertFilesExist('./registry/', 'app.css');
		assertFilesExist('./registry/src/', 'hooks.ts');
	});
});

const defaultConfig = {
	$schema: '',
	readme: 'README',
	dirs: [],
	doNotListBlocks: [],
	doNotListCategories: [],
	listBlocks: [],
	listCategories: [],
	excludeDeps: [],
	includeBlocks: [],
	includeCategories: [],
	excludeBlocks: [],
	excludeCategories: [],
};

describe('shouldListBlock', () => {
	it('lists if unspecified', () => {
		expect(shouldListBlock('a', { ...defaultConfig, includeDocs: false })).toBe(true);
	});

	it('lists when should list', () => {
		expect(
			shouldListBlock('a', { ...defaultConfig, listBlocks: ['a'], includeDocs: false })
		).toBe(true);
		expect(
			shouldListBlock('a', { ...defaultConfig, doNotListBlocks: ['b'], includeDocs: false })
		).toBe(true);
	});

	it('does not list when should not list', () => {
		expect(
			shouldListBlock('a', { ...defaultConfig, listBlocks: ['b'], includeDocs: false })
		).toBe(false);
		expect(
			shouldListBlock('a', { ...defaultConfig, doNotListBlocks: ['a'], includeDocs: false })
		).toBe(false);
	});
});

describe('shouldListCategory', () => {
	it('lists if unspecified', () => {
		expect(shouldListCategory('a', { ...defaultConfig, includeDocs: false })).toBe(true);
	});

	it('lists when should list', () => {
		expect(
			shouldListCategory('a', { ...defaultConfig, listCategories: ['a'], includeDocs: false })
		).toBe(true);
		expect(
			shouldListCategory('a', {
				...defaultConfig,
				doNotListCategories: ['b'],
				includeDocs: false,
			})
		).toBe(true);
	});

	it('does not list when should not list', () => {
		expect(
			shouldListCategory('a', { ...defaultConfig, listCategories: ['b'], includeDocs: false })
		).toBe(false);
		expect(
			shouldListCategory('a', {
				...defaultConfig,
				doNotListCategories: ['a'],
				includeDocs: false,
			})
		).toBe(false);
	});
});

describe('shouldIncludeBlock', () => {
	it('lists if unspecified', () => {
		expect(shouldIncludeBlock('a', { ...defaultConfig, includeDocs: false })).toBe(true);
	});

	it('lists when should list', () => {
		expect(
			shouldIncludeBlock('a', { ...defaultConfig, includeBlocks: ['a'], includeDocs: false })
		).toBe(true);
		expect(
			shouldIncludeBlock('a', { ...defaultConfig, excludeBlocks: ['b'], includeDocs: false })
		).toBe(true);
	});

	it('does not list when should not list', () => {
		expect(
			shouldIncludeBlock('a', { ...defaultConfig, includeBlocks: ['b'], includeDocs: false })
		).toBe(false);
		expect(
			shouldIncludeBlock('a', { ...defaultConfig, excludeBlocks: ['a'], includeDocs: false })
		).toBe(false);
	});
});

describe('shouldIncludeCategory', () => {
	it('lists if unspecified', () => {
		expect(shouldIncludeCategory('a', { ...defaultConfig, includeDocs: false })).toBe(true);
	});

	it('lists when should list', () => {
		expect(
			shouldIncludeCategory('a', {
				...defaultConfig,
				includeCategories: ['a'],
				includeDocs: false,
			})
		).toBe(true);
		expect(
			shouldIncludeCategory('a', {
				...defaultConfig,
				excludeCategories: ['b'],
				includeDocs: false,
			})
		).toBe(true);
	});

	it('does not list when should not list', () => {
		expect(
			shouldIncludeCategory('a', {
				...defaultConfig,
				includeCategories: ['b'],
				includeDocs: false,
			})
		).toBe(false);
		expect(
			shouldIncludeCategory('a', {
				...defaultConfig,
				excludeCategories: ['a'],
				includeDocs: false,
			})
		).toBe(false);
	});
});
