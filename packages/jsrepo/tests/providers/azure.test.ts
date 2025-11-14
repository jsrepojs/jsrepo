import { describe, it } from 'vitest';
import { azure } from '@/providers';
import type { AbsolutePath } from '@/utils/types';

describe('azure', () => {
	it('correctly resolves repository url', async () => {
		const az = azure();
		const azureState = await az.create('azure/ieedan/std/std', {
			cwd: process.cwd() as AbsolutePath,
			token: undefined,
		});
		await azureState.fetch('README.md', { token: undefined });
	});
});
