import { fs } from 'jsrepo/providers';
import { describe, it } from 'vitest';

describe('fs', () => {
	it('correctly resolves path', async () => {
		const f = fs();
		const fState = await f.create('fs://./tests/providers', {
			cwd: process.cwd(),
			token: undefined,
		});
		await fState.fetch('fs.test.ts', { token: undefined });
	});

	it('correctly resolves path with baseDir', async () => {
		const f = fs({ baseDir: './tests/providers' });
		const fState = await f.create('fs://.', { cwd: process.cwd(), token: undefined });
		await fState.fetch('fs.test.ts', { token: undefined });
	});
});
