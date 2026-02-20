import type { AbsolutePath } from 'jsrepo/utils';
import path from 'pathe';
import { describe, expect, it } from 'vitest';
import { pnpm } from '../src/index.js';

const fixturesDir = path.join(
	path.dirname(new URL(import.meta.url).pathname),
	'fixtures',
	'pnpm-workspace'
) as AbsolutePath;

describe('pnpm resolver', () => {
	const cwd = fixturesDir;
	const resolver = pnpm();

	it('should resolve workspace:* to exact version', async () => {
		const dep = { ecosystem: 'js' as const, name: 'pkg-a', version: 'workspace:*' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'pkg-a', version: '1.2.3' });
	});

	it('should resolve workspace:^ to ^version', async () => {
		const dep = { ecosystem: 'js' as const, name: 'pkg-a', version: 'workspace:^' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'pkg-a', version: '^1.2.3' });
	});

	it('should resolve workspace:~ to ~version', async () => {
		const dep = { ecosystem: 'js' as const, name: 'pkg-b', version: 'workspace:~' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'pkg-b', version: '~2.0.0' });
	});

	it('should resolve workspace:1.0.0 to literal version', async () => {
		const dep = { ecosystem: 'js' as const, name: 'pkg-a', version: 'workspace:1.0.0' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'pkg-a', version: '1.0.0' });
	});

	it('should resolve catalog: (default) to catalog version', async () => {
		const dep = { ecosystem: 'js' as const, name: 'lodash', version: 'catalog:' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'lodash', version: '^4.17.21' });
	});

	it('should resolve catalog:deps (named) to named catalog version', async () => {
		const dep = { ecosystem: 'js' as const, name: 'react', version: 'catalog:deps' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'react', version: '^18.0.0' });
	});

	it('should return dep unchanged when version is not workspace/catalog', async () => {
		const dep = { ecosystem: 'js' as const, name: 'lodash', version: '^1.0.0' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual(dep);
	});

	it('should return dep unchanged when version is undefined', async () => {
		const dep = { ecosystem: 'js' as const, name: 'lodash' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual(dep);
	});

	it('should throw when workspace package not found', async () => {
		const dep = { ecosystem: 'js' as const, name: 'nonexistent', version: 'workspace:*' };
		await expect(resolver(dep, { cwd })).rejects.toThrow(
			/Workspace package "nonexistent" not found/
		);
	});

	it('should throw when catalog entry not found', async () => {
		const dep = { ecosystem: 'js' as const, name: 'nonexistent', version: 'catalog:' };
		await expect(resolver(dep, { cwd })).rejects.toThrow(
			/Package "nonexistent" not found in catalog/
		);
	});

	it('should use options.cwd for discovery', async () => {
		const dep = { ecosystem: 'js' as const, name: 'pkg-a', version: 'workspace:*' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved.version).toBe('1.2.3');
	});

	it('should cache: multiple resolutions with same cwd do not re-parse', async () => {
		const dep1 = { ecosystem: 'js' as const, name: 'pkg-a', version: 'workspace:*' };
		const dep2 = { ecosystem: 'js' as const, name: 'pkg-b', version: 'workspace:*' };
		const r1 = await resolver(dep1, { cwd });
		const r2 = await resolver(dep2, { cwd });
		expect(r1.version).toBe('1.2.3');
		expect(r2.version).toBe('2.0.0');
	});

	it('should resolve workspace:../path to version from package at path', async () => {
		const dep = {
			ecosystem: 'js' as const,
			name: 'pkg-a',
			version: 'workspace:packages/pkg-a',
		};
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'pkg-a', version: '1.2.3' });
	});

	it('should resolve workspace:alias@* to npm:package@version', async () => {
		const dep = {
			ecosystem: 'js' as const,
			name: 'my-alias',
			version: 'workspace:pkg-a@*',
		};
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({
			ecosystem: 'js',
			name: 'my-alias',
			version: 'npm:pkg-a@1.2.3',
		});
	});
});
