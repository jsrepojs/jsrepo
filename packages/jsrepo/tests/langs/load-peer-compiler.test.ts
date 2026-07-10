import path from 'pathe';
import { describe, expect, it } from 'vitest';
import { loadPeerCompiler } from '@/langs/load-peer-compiler';
import { MissingPeerDependencyError } from '@/utils/errors';
import type { AbsolutePath } from '@/utils/types';

const CWD = process.cwd() as AbsolutePath;

describe('loadPeerCompiler', () => {
	it('resolves a peer compiler installed in the project cwd', async () => {
		const compiler = await loadPeerCompiler<typeof import('svelte/compiler')>(
			'svelte/compiler',
			{
				cwd: CWD,
				packageName: 'svelte',
				feature: 'Svelte language support',
			}
		);

		expect(typeof compiler.preprocess).toBe('function');
	});

	it('throws a MissingPeerDependencyError when the module cannot be resolved from anywhere', async () => {
		// a directory with no node_modules containing the dependency
		const emptyCwd = path.join(__dirname, '../fixtures') as AbsolutePath;

		await expect(
			loadPeerCompiler('this-package-does-not-exist/compiler', {
				cwd: emptyCwd,
				packageName: 'this-package-does-not-exist',
				feature: 'Nonexistent language support',
			})
		).rejects.toBeInstanceOf(MissingPeerDependencyError);
	});
});
