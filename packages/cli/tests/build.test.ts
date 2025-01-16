import fs from 'node:fs';
import path from 'pathe';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cli } from '../src/cli';
import type { Category } from '../src/utils/build';
import type { RegistryConfig } from '../src/utils/config';
import { assertFilesExist } from './utils';

describe('add', () => {
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

		const config: RegistryConfig = {
			$schema: '',
			dirs: ['./src'],
			includeBlocks: [],
			includeCategories: [],
			excludeBlocks: [],
			excludeCategories: [],
			doNotListBlocks: [],
			doNotListCategories: [],
			listBlocks: [],
			listCategories: [],
			excludeDeps: [],
		};

		fs.writeFileSync('jsrepo-build-config.json', JSON.stringify(config));

		fs.mkdirSync('./src/utils', { recursive: true });

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

		// build

		await cli.parseAsync(['node', 'jsrepo', 'build', '--cwd', testDir]);

		const manifest = JSON.parse(
			fs.readFileSync('jsrepo-manifest.json').toString()
		) as Category[];

		expect(manifest).toStrictEqual([
			{
				blocks: [
					{
						_imports_: {
							'./log': '{{utils/log}}',
						},
						category: 'utils',
						dependencies: [],
						devDependencies: [],
						directory: 'src/utils',
						files: ['add.ts'],
						list: true,
						localDependencies: ['utils/log'],
						name: 'add',
						subdirectory: false,
						tests: false,
					},
					{
						_imports_: {},
						category: 'utils',
						dependencies: ['chalk@^5.3.0'],
						devDependencies: [],
						directory: 'src/utils',
						files: ['log.ts'],
						list: true,
						localDependencies: [],
						name: 'log',
						subdirectory: false,
						tests: false,
					},
				],
				name: 'utils',
			},
		] satisfies Category[]);
	});

	it('builds and copies files to correct location', async () => {
		// create package.json
		const pkg = {
			name: 'registry',
			dependencies: {
				chalk: '^5.3.0',
			},
		};

		fs.writeFileSync('package.json', JSON.stringify(pkg));

		fs.mkdirSync('./src/utils', { recursive: true });

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

		// build

		await cli.parseAsync([
			'node',
			'jsrepo',
			'build',
			'--cwd',
			testDir,
			'--dirs',
			'./src',
			'--output-dir',
			'./registry',
		]);

		const manifest = JSON.parse(
			fs.readFileSync('./registry/jsrepo-manifest.json').toString()
		) as Category[];

		expect(manifest).toStrictEqual([
			{
				blocks: [
					{
						_imports_: {
							'./log': '{{utils/log}}',
						},
						category: 'utils',
						dependencies: [],
						devDependencies: [],
						directory: 'src/utils',
						files: ['add.ts'],
						list: true,
						localDependencies: ['utils/log'],
						name: 'add',
						subdirectory: false,
						tests: false,
					},
					{
						_imports_: {},
						category: 'utils',
						dependencies: ['chalk@^5.3.0'],
						devDependencies: [],
						directory: 'src/utils',
						files: ['log.ts'],
						list: true,
						localDependencies: [],
						name: 'log',
						subdirectory: false,
						tests: false,
					},
				],
				name: 'utils',
			},
		] satisfies Category[]);

		assertFilesExist('./registry/src/utils', 'add.ts', 'log.ts');
	});
});
