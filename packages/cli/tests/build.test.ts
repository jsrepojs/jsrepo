import fs from 'node:fs';
import path from 'pathe';
import { assert, afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cli } from '../src/cli';
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
			dirs: ['./src', './'],
			includeBlocks: [],
			includeCategories: [],
			excludeBlocks: [],
			excludeCategories: ['src'],
			doNotListBlocks: [],
			doNotListCategories: [],
			listBlocks: [],
			listCategories: [],
			excludeDeps: [],
			allowSubdirectories: true,
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

		fs.mkdirSync('./ignored/', { recursive: true });
		fs.mkdirSync('./.ignored/', { recursive: true });

		fs.writeFileSync('./ignored/b.ts', '');
		fs.writeFileSync('./.ignored/a.ts', '');

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

		fs.writeFileSync(
			'./src/utils/add.ts',
			`import { log } from "./log";

export const add = (a: number, b: number) => a + b;

export const logAnswer = (a: number, b: number) => log(\`Answer is: \${add(a, b)}\`);`
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
			categories: [
				{
					name: 'types',
					blocks: [
						{
							name: 'point',
							directory: 'src/types',
							category: 'types',
							tests: false,
							subdirectory: false,
							list: true,
							files: ['point.ts'],
							localDependencies: [],
							_imports_: {},
							dependencies: [],
							devDependencies: [],
						},
					],
				},
				{
					name: 'utils',
					blocks: [
						{
							name: 'add',
							directory: 'src/utils',
							category: 'utils',
							tests: false,
							subdirectory: false,
							list: true,
							files: ['add.ts'],
							localDependencies: ['utils/log'],
							_imports_: {
								'./log': '{{utils/log}}',
							},
							dependencies: [],
							devDependencies: [],
						},
						{
							name: 'form1',
							directory: 'src/utils/form1',
							category: 'utils',
							tests: false,
							subdirectory: true,
							list: true,
							files: ['client/form.svelte', 'server/index.ts', 'types.ts'],
							localDependencies: [],
							dependencies: ['valibot@1.0.0-beta.14'],
							devDependencies: [],
							_imports_: {},
						},
						{
							name: 'log',
							directory: 'src/utils',
							category: 'utils',
							tests: false,
							subdirectory: false,
							list: true,
							files: ['log.ts'],
							localDependencies: [],
							_imports_: {},
							dependencies: ['chalk@^5.3.0'],
							devDependencies: [],
						},
						{
							name: 'math',
							directory: 'src/utils',
							category: 'utils',
							tests: false,
							subdirectory: false,
							list: true,
							files: ['math.ts'],
							localDependencies: ['types/point'],
							_imports_: {
								'$types/point.js': '{{types/point}}.js',
							},
							dependencies: [],
							devDependencies: [],
						},
					],
				},
			],
		});

		// ensure files were copied correctly
		assertFilesExist('./registry/src/utils', 'add.ts', 'log.ts', 'math.ts');
		assertFilesExist(
			'./registry/src/utils/form1',
			'types.ts',
			'./client/form.svelte',
			'./server/index.ts'
		);
		assertFilesExist('./registry/src/types', 'point.ts');
	});
});

const defaultConfig = {
	$schema: '',
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
		expect(shouldListBlock('a', { ...defaultConfig })).toBe(true);
	});

	it('lists when should list', () => {
		expect(shouldListBlock('a', { ...defaultConfig, listBlocks: ['a'] })).toBe(true);
		expect(shouldListBlock('a', { ...defaultConfig, doNotListBlocks: ['b'] })).toBe(true);
	});

	it('does not list when should not list', () => {
		expect(shouldListBlock('a', { ...defaultConfig, listBlocks: ['b'] })).toBe(false);
		expect(shouldListBlock('a', { ...defaultConfig, doNotListBlocks: ['a'] })).toBe(false);
	});
});

describe('shouldListCategory', () => {
	it('lists if unspecified', () => {
		expect(shouldListCategory('a', { ...defaultConfig })).toBe(true);
	});

	it('lists when should list', () => {
		expect(shouldListCategory('a', { ...defaultConfig, listCategories: ['a'] })).toBe(true);
		expect(shouldListCategory('a', { ...defaultConfig, doNotListCategories: ['b'] })).toBe(
			true
		);
	});

	it('does not list when should not list', () => {
		expect(shouldListCategory('a', { ...defaultConfig, listCategories: ['b'] })).toBe(false);
		expect(shouldListCategory('a', { ...defaultConfig, doNotListCategories: ['a'] })).toBe(
			false
		);
	});
});

describe('shouldIncludeBlock', () => {
	it('lists if unspecified', () => {
		expect(shouldIncludeBlock('a', { ...defaultConfig })).toBe(true);
	});

	it('lists when should list', () => {
		expect(shouldIncludeBlock('a', { ...defaultConfig, includeBlocks: ['a'] })).toBe(true);
		expect(shouldIncludeBlock('a', { ...defaultConfig, excludeBlocks: ['b'] })).toBe(true);
	});

	it('does not list when should not list', () => {
		expect(shouldIncludeBlock('a', { ...defaultConfig, includeBlocks: ['b'] })).toBe(false);
		expect(shouldIncludeBlock('a', { ...defaultConfig, excludeBlocks: ['a'] })).toBe(false);
	});
});

describe('shouldIncludeCategory', () => {
	it('lists if unspecified', () => {
		expect(shouldIncludeCategory('a', { ...defaultConfig })).toBe(true);
	});

	it('lists when should list', () => {
		expect(shouldIncludeCategory('a', { ...defaultConfig, includeCategories: ['a'] })).toBe(
			true
		);
		expect(shouldIncludeCategory('a', { ...defaultConfig, excludeCategories: ['b'] })).toBe(
			true
		);
	});

	it('does not list when should not list', () => {
		expect(shouldIncludeCategory('a', { ...defaultConfig, includeCategories: ['b'] })).toBe(
			false
		);
		expect(shouldIncludeCategory('a', { ...defaultConfig, excludeCategories: ['a'] })).toBe(
			false
		);
	});
});
