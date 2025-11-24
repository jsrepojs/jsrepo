import fs from 'node:fs';
import path from 'pathe';
import { describe, expect, it, vi } from 'vitest';
import { svelte } from '@/langs/svelte';
import { joinAbsolute } from '@/utils/path';
import type { AbsolutePath } from '@/utils/types';

const CWD = path.join(__dirname, '../fixtures/langs/svelte') as AbsolutePath;

describe('svelte', () => {
	it('should resolve dependencies', async () => {
		const warn = vi.fn();
		const absolutePath = joinAbsolute(CWD, 'page.svelte');
		const code = fs.readFileSync(absolutePath, 'utf-8');
		const result = await svelte().resolveDependencies(code, {
			fileName: absolutePath,
			cwd: CWD,
			excludeDeps: [],
			warn,
		});

		expect(result.localDependencies[0]?.import).toBe('../js/logger');
		expect(result.dependencies[0]?.name).toBe('svelte');
		expect(result.dependencies[0]?.version).toBe(undefined);
	});

	it('should exclude excluded dependencies', async () => {
		const warn = vi.fn();
		const absolutePath = joinAbsolute(CWD, 'page.svelte');
		const code = fs.readFileSync(absolutePath, 'utf-8');
		const result = await svelte().resolveDependencies(code, {
			fileName: absolutePath,
			cwd: CWD,
			excludeDeps: ['svelte'],
			warn,
		});

		expect(result.localDependencies[0]?.import).toBe('../js/logger');
		expect(result.dependencies[0]?.name).toBe(undefined);
		expect(result.dependencies[0]?.version).toBe(undefined);
	});
});
