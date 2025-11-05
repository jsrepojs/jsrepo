import { gitlab } from 'jsrepo/providers';
import { describe, it } from 'vitest';

describe('gitlab', () => {
	it('correctly resolves repository url', async () => {
		const gl = gitlab();
		const gitlabState = await gl.create('gitlab/ieedan/std', {
			cwd: process.cwd(),
			token: undefined,
		});
		await gitlabState.fetch('README.md');
	});

	it('correctly resolves repository url with custom baseUrl', async () => {
		const gl = gitlab();
		const gitlabState = await gl.create('gitlab:https://gitlab.com/ieedan/std', {
			cwd: process.cwd(),
			token: undefined,
		});
		await gitlabState.fetch('README.md');
	});

	it('correctly resolves nested group urls', async () => {
		const gl = gitlab();
		const gitlabState = await gl.create('gitlab/jsrepo/tests/test1', {
			cwd: process.cwd(),
			token: undefined,
		});
		await gitlabState.fetch('README.md');
	});

	it('correctly resolves nested group urls with ref', async () => {
		const gl = gitlab();
		const gitlabState = await gl.create('gitlab/jsrepo/tests/test1/-/tree/main', {
			cwd: process.cwd(),
			token: undefined,
		});
		await gitlabState.fetch('README.md');
	});
});
