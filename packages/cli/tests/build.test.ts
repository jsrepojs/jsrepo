import fs from 'node:fs';
import path from 'pathe';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cli } from '../src/cli';
import type { Category } from '../src/utils/build';
import type { RegistryConfig } from '../src/utils/config';
import { assertFilesExist } from './utils';

describe('build', () => {
	const testDir = path.join(__dirname, '../temp-test/build');

	beforeAll(async () => {
		if (fs.existsSync(testDir)) {
			fs.rmdirSync(testDir, { recursive: true });
		}

		fs.mkdirSync(testDir, { recursive: true });
		// cd into testDir
		process.chdir(testDir);
	});

	afterAll(() => {
		process.chdir(__dirname); // unlock directory

		fs.rmdirSync(testDir, { recursive: true });
	});

	it('builds local and remote dependencies', async () => {
		// create package.json
		const pkg = {
			name: 'registry',
			dependencies: {
				chalk: '^5.3.0',
			},
		};

		fs.writeFileSync('package.json', JSON.stringify(pkg));

		const buildConfig: RegistryConfig = {
			$schema: '',
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

		const manifest = JSON.parse(
			fs.readFileSync('./registry/jsrepo-manifest.json').toString()
		) as Category[];

		expect(manifest).toStrictEqual([
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
		] satisfies Category[]);

		// ensure files were copied correctly
		assertFilesExist('./registry/src/utils', 'add.ts', 'log.ts', 'math.ts');
		assertFilesExist('./registry/src/types', 'point.ts');
	});
});
