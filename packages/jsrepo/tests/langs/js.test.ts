import fs from 'node:fs';
import path from 'pathe';
import { describe, expect, it, vi } from 'vitest';
import { js } from '@/langs/js';

const CWD = path.join(__dirname, '../fixtures/langs/js');

describe('js', () => {
	it('should resolve dependencies', async () => {
		const warn = vi.fn();
		const code = fs.readFileSync(path.join(CWD, 'logger.ts'), 'utf-8');
		const result = await js().resolveDependencies(code, {
			fileName: 'logger.ts',
			cwd: CWD,
			excludeDeps: [],
			warn,
		});

		expect(result.localDependencies[0]?.import).toBe('./stdout');
		expect(result.devDependencies[0]?.name).toBe('picocolors');
		expect(result.devDependencies[0]?.version).toBe('catalog:');
	});

	it('should exclude excluded dependencies', async () => {
		const warn = vi.fn();
		const code = fs.readFileSync(path.join(CWD, 'logger.ts'), 'utf-8');
		const result = await js().resolveDependencies(code, {
			fileName: 'logger.ts',
			cwd: CWD,
			excludeDeps: ['picocolors'],
			warn,
		});

		expect(result.localDependencies[0]?.import).toBe('./stdout');
		expect(result.devDependencies[0]?.name).toBe(undefined);
		expect(result.devDependencies[0]?.version).toBe(undefined);
	});
});
