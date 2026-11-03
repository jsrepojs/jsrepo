import path from 'pathe';
import { describe, expect, it } from 'vitest';
import { loadConfigSearch, resolvePath } from '@/utils/config/utils';
import type { AbsolutePath } from '@/utils/types';

describe('loadConfigSearch', () => {
	it('should load the config', async () => {
		const config = await loadConfigSearch({
			cwd: path.join(__dirname, '../fixtures/config/basic') as AbsolutePath,
			promptForContinueIfNull: false,
		});

		expect(config).not.toBeNull();
	});

	it('should load a mts config', async () => {
		const config = await loadConfigSearch({
			cwd: path.join(__dirname, '../fixtures/config/mts') as AbsolutePath,
			promptForContinueIfNull: false,
		});

		expect(config).not.toBeNull();
	});

	it('should find the config in a higher directory', async () => {
		const config = await loadConfigSearch({
			cwd: path.join(__dirname, '../fixtures/config/nested/lower') as AbsolutePath,
			promptForContinueIfNull: false,
		});

		expect(config).not.toBeNull();
	});

	it('should not find the config when it does not exist', async () => {
		const config = await loadConfigSearch({
			cwd: path.join(__dirname, '../fixtures/config/none') as AbsolutePath,
			promptForContinueIfNull: false,
		});

		expect(config).toBeNull();
	});
});

describe('resolvePath', () => {
	const cwd = path.join(__dirname, '../fixtures/config/package-imports') as AbsolutePath;

	it('should not resolve relative paths', () => {
		expect(resolvePath('./src/lib', { cwd, matcher: null })).toBe('./src/lib');
	});

	it('should resolve plain paths relative to the cwd', () => {
		expect(resolvePath('src/lib', { cwd, matcher: null })).toBe('src/lib');
	});

	it('should resolve tsconfig aliases using the matcher', () => {
		const matcher = (p: string) => (p === '$lib' ? [path.join(cwd, 'src/lib')] : []);
		expect(resolvePath('$lib', { cwd, matcher })).toBe('src/lib');
	});

	it('should resolve package.json imports to the wildcard directory', () => {
		expect(resolvePath('#lib', { cwd, matcher: null })).toBe('src/lib');
	});

	it('should resolve subpaths of package.json imports', () => {
		expect(resolvePath('#lib/ui', { cwd, matcher: null })).toBe('src/lib/ui');
	});

	it('should resolve package.json imports when the matcher finds nothing', () => {
		expect(resolvePath('#lib', { cwd, matcher: () => [] })).toBe('src/lib');
	});

	it('should resolve exact entries that point to a directory', () => {
		expect(resolvePath('#utils', { cwd, matcher: null })).toBe('src/utils');
	});

	it('should only use supported conditions', () => {
		expect(resolvePath('#conditional', { cwd, matcher: null })).toBe('src/conditional');
	});

	it('should fall back to the literal path when the import is not found', () => {
		expect(resolvePath('#missing', { cwd, matcher: null })).toBe('#missing');
	});

	it('should not resolve imports that point to packages', () => {
		expect(resolvePath('#pkg', { cwd, matcher: null })).toBe('#pkg');
	});
});
