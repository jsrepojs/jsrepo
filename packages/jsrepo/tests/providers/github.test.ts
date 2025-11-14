import { describe, it } from 'vitest';
import { github } from '@/providers';
import type { AbsolutePath } from '@/utils/types';

describe('github', () => {
	it('correctly resolves repository url', async () => {
		const gh = github();
		const githubState = await gh.create('github/ieedan/std', {
			cwd: process.cwd() as AbsolutePath,
			token: undefined,
		});
		await githubState.fetch('README.md', { token: undefined });
	});
});
