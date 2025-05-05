import fs from 'node:fs';
import path from 'pathe';
import { x } from 'tinyexec';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { cli } from '../src/cli';
import * as u from '../src/utils/blocks/ts/url';
import type { ProjectConfig } from '../src/utils/config';
import { assertFilesExist } from './utils';

describe('add', () => {
	const testDir = path.join(__dirname, '../temp-test/add');

	const addBlock = async (registry: string, block: `${string}/${string}`) => {
		const config: ProjectConfig = {
			$schema: '',
			includeTests: false,
			paths: {
				'*': './src',
				types: './types',
			},
			repos: [registry],
			watermark: true,
		};

		fs.writeFileSync('jsrepo.json', JSON.stringify(config));

		await cli.parseAsync(['node', 'jsrepo', 'add', block, '-y', '--verbose', '--cwd', testDir]);
	};

	const addBlockZeroConfig = async (registry: string, block: `${string}/${string}`) => {
		await cli.parseAsync([
			'node',
			'jsrepo',
			'add',
			u.join(registry, block),
			'--formatter',
			'none',
			'--watermark',
			'true',
			'--tests',
			'false',
			'--paths',
			"'*=./src'",
			'-y',
			'--verbose',
			'--cwd',
			testDir,
		]);
	};

	beforeAll(async () => {
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, { recursive: true });
		}

		fs.mkdirSync(testDir, { recursive: true });
		// cd into testDir
		process.chdir(testDir);

		// create package.json
		await x('pnpm', ['init']);
	});

	afterAll(() => {
		process.chdir(__dirname); // unlock directory

		fs.rmSync(testDir, { recursive: true });
	});

	it('adds from github', async () => {
		await addBlock('github/ieedan/std/tree/v2.2.0', 'utils/math');

		const blockBaseDir = './src/utils/math';

		const expectedFiles = [
			'circle.ts',
			'conversions.ts',
			'fractions.ts',
			'gcf.ts',
			'index.ts',
			'triangles.ts',
			'types.ts',
		];

		assertFilesExist(blockBaseDir, ...expectedFiles);
	});

	it('adds block to correct directory', async () => {
		await addBlock('github/ieedan/std/tree/v2.2.0', 'types/result');

		const blockBaseDir = './types';

		const expectedFiles = ['result.ts'];

		assertFilesExist(blockBaseDir, ...expectedFiles);
	});

	it('adds from gitlab', async () => {
		await addBlock('gitlab/ieedan/std', 'utils/math');

		const blockBaseDir = './src/utils/math';

		const expectedFiles = [
			'circle.ts',
			'conversions.ts',
			'fractions.ts',
			'gcf.ts',
			'index.ts',
			'triangles.ts',
			'types.ts',
		];

		assertFilesExist(blockBaseDir, ...expectedFiles);
	});

	it('adds from azure', async () => {
		await addBlock('azure/ieedan/std/std', 'utils/math');

		const blockBaseDir = './src/utils/math';

		const expectedFiles = [
			'circle.ts',
			'conversions.ts',
			'fractions.ts',
			'gcf.ts',
			'index.ts',
			'triangles.ts',
			'types.ts',
		];

		assertFilesExist(blockBaseDir, ...expectedFiles);
	});

	it('adds from http', async () => {
		await addBlock('https://jsrepo-http.vercel.app/', 'utils/math');

		const blockBaseDir = './src/utils/math';

		const expectedFiles = [
			'circle.ts',
			'conversions.ts',
			'fractions.ts',
			'gcf.ts',
			'index.ts',
			'triangles.ts',
			'types.ts',
		];

		assertFilesExist(blockBaseDir, ...expectedFiles);
	});

	it('adds from jsrepo.com', async () => {
		await addBlock('@ieedan/std', 'ts/math');

		const blockBaseDir = './src/ts/math';

		const expectedFiles = [
			'circle.ts',
			'conversions.ts',
			'fractions.ts',
			'gcf.ts',
			'index.ts',
			'triangles.ts',
			'types.ts',
		];

		assertFilesExist(blockBaseDir, ...expectedFiles);
	});

	it('adds with zero-config without interaction', async () => {
		await addBlockZeroConfig('github/ieedan/std', 'ts/is-letter');

		const blockBaseDir = './src/ts';

		assertFilesExist(blockBaseDir, 'is-letter.ts');
	});
});
