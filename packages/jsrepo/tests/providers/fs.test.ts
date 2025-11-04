import { fs } from 'jsrepo/providers';
import { describe, it } from 'vitest';

describe('fs', () => {
	it('correctly resolves path', async () => {
		const f = fs();
		const fState = await f.create('fs://./tests/providers', { cwd: process.cwd() });
		await fState.fetch('fs.test.ts');
	});

	it('correctly resolves path with baseDir', async () => {
		const f = fs({ baseDir: './tests/providers' });
		const fState = await f.create('fs://.', { cwd: process.cwd() });
		await fState.fetch('fs.test.ts');
	});
});
