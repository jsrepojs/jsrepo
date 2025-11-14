import { describe, it } from 'vitest';
import { http } from '@/providers';
import type { AbsolutePath } from '@/utils/types';

describe('http', () => {
	it('correctly resolves repository url', async () => {
		const h = http();
		const httpState = await h.create('https://jsrepo-http.vercel.app', {
			cwd: process.cwd() as AbsolutePath,
			token: undefined,
		});
		await httpState.fetch('jsrepo-manifest.json', { token: undefined });
	});
});
