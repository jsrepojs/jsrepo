import fs from 'node:fs';
import { execa } from 'execa';
import path from 'pathe';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { cli } from '../src/cli';
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

	beforeAll(async () => {
		if (fs.existsSync(testDir)) {
			fs.rmdirSync(testDir, { recursive: true });
		}

		fs.mkdirSync(testDir, { recursive: true });
		// cd into testDir
		process.chdir(testDir);

		// create package.json
		await execa`pnpm init`;
	});

	afterAll(() => {
		process.chdir(__dirname); // unlock directory

		fs.rmdirSync(testDir, { recursive: true });
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
});
