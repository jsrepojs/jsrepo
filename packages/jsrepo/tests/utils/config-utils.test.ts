import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfigSearch } from '@/utils/config/utils';

describe('loadConfigSearch', () => {
	it('should load the config', async () => {
		const config = await loadConfigSearch({
			cwd: path.join(import.meta.dirname, '../fixtures/config/basic'),
			promptForContinueIfNull: false,
		});

		expect(config).not.toBeNull();
	});

	it('should load a mts config', async () => {
		const config = await loadConfigSearch({
			cwd: path.join(import.meta.dirname, '../fixtures/config/mts'),
			promptForContinueIfNull: false,
		});

		expect(config).not.toBeNull();
	});

	it('should find the config in a higher directory', async () => {
		const config = await loadConfigSearch({
			cwd: path.join(import.meta.dirname, '../fixtures/config/nested/lower'),
			promptForContinueIfNull: false,
		});

		expect(config).not.toBeNull();
	});

	it('should not find the config when it does not exist', async () => {
		const config = await loadConfigSearch({
			cwd: path.join(import.meta.dirname, '../fixtures/config/none'),
			promptForContinueIfNull: false,
		});

		expect(config).toBeNull();
	});
});
