import { github } from 'jsrepo/providers';
import { describe, it } from 'vitest';

describe('github', () => {
	it('correctly resolves repository url', async () => {
		const gh = github();
		const githubState = await gh.create('github/ieedan/std', {
			cwd: process.cwd(),
			token: undefined,
		});
		await githubState.fetch('README.md', { token: undefined });
	});
});
