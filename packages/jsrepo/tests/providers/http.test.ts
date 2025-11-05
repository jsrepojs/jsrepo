import { http } from 'jsrepo/providers';
import { describe, it } from 'vitest';

describe('http', () => {
	it('correctly resolves repository url', async () => {
		const h = http();
		const httpState = await h.create('https://jsrepo-http.vercel.app', {
			cwd: process.cwd(),
			token: undefined,
		});
		await httpState.fetch('jsrepo-manifest.json');
	});
});
