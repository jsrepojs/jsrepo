import { describe, it } from 'vitest';
import { fs } from '@/providers';
import type { AbsolutePath } from '@/utils/types';

describe('fs', () => {
	it('correctly resolves path', async () => {
		const f = fs();
		const fState = await f.create('fs://./tests/providers', {
			cwd: process.cwd() as AbsolutePath,
			token: undefined,
		});
		await fState.fetch('fs.test.ts', { token: undefined });
	});

	it('correctly resolves path with baseDir', async () => {
		const f = fs({ baseDir: './tests/providers' });
		const fState = await f.create('fs://.', {
			cwd: process.cwd() as AbsolutePath,
			token: undefined,
		});
		await fState.fetch('fs.test.ts', { token: undefined });
	});
});
