import { azure } from 'jsrepo/providers';
import { describe, it } from 'vitest';

describe('azure', () => {
	it('correctly resolves repository url', async () => {
		const az = azure();
		const azureState = await az.create('azure/ieedan/std/std', {
			cwd: process.cwd(),
			token: undefined,
		});
		await azureState.fetch('README.md', { token: undefined });
	});
});
