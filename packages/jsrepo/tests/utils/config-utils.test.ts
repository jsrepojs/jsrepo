import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfigSearch } from '@/utils/config/utils';
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
