import { bitbucket } from 'jsrepo/providers';
import { describe, it } from 'vitest';

describe('bitbucket', () => {
	it('correctly resolves repository url', async () => {
		const bb = bitbucket();
		const bitbucketState = await bb.create('bitbucket/ieedan/std', {
			cwd: process.cwd(),
			token: undefined,
		});
		await bitbucketState.fetch('README.md', { token: undefined });
	});

	it('correctly resolves repository url with custom baseUrl', async () => {
		const bb = bitbucket();
		const bitbucketState = await bb.create('bitbucket:https://bitbucket.org/ieedan/std', {
			cwd: process.cwd(),
			token: undefined,
		});
		await bitbucketState.fetch('README.md', { token: undefined });
	});
});
