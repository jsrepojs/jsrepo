import type { AbsolutePath } from 'jsrepo/utils';
import path from 'pathe';
import { describe, expect, it } from 'vitest';
import { bun } from '../src/index.js';

const fixturesDir = path.join(
	path.dirname(new URL(import.meta.url).pathname),
	'fixtures',
	'bun-workspace'
) as AbsolutePath;

const fixturesDirObject = path.join(
	path.dirname(new URL(import.meta.url).pathname),
	'fixtures',
	'bun-workspace-object'
) as AbsolutePath;

describe('bun resolver', () => {
	const cwd = fixturesDir;
	const cwdObject = fixturesDirObject;
	const resolver = bun();

	it('should resolve workspace:* to exact version', async () => {
		const dep = { ecosystem: 'js' as const, name: 'foo', version: 'workspace:*' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'foo', version: '3.0.1' });
	});

	it('should resolve workspace:^ to ^version', async () => {
		const dep = { ecosystem: 'js' as const, name: 'foo', version: 'workspace:^' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'foo', version: '^3.0.1' });
	});

	it('should resolve workspace:~ to ~version', async () => {
		const dep = { ecosystem: 'js' as const, name: 'bar', version: 'workspace:~' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'bar', version: '~0.1.0' });
	});

	it('should resolve workspace:1.0.0 to literal version', async () => {
		const dep = { ecosystem: 'js' as const, name: 'foo', version: 'workspace:1.0.0' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'foo', version: '1.0.0' });
	});

	it('should return dep unchanged when version is not workspace', async () => {
		const dep = { ecosystem: 'js' as const, name: 'foo', version: '^1.0.0' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual(dep);
	});

	it('should return dep unchanged when version is undefined', async () => {
		const dep = { ecosystem: 'js' as const, name: 'foo' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved).toEqual(dep);
	});

	it('should throw when workspace package not found', async () => {
		const dep = { ecosystem: 'js' as const, name: 'nonexistent', version: 'workspace:*' };
		await expect(resolver(dep, { cwd })).rejects.toThrow(
			/Workspace package "nonexistent" not found/
		);
	});

	it('should support workspaces: ["packages/*"] (array)', async () => {
		const dep = { ecosystem: 'js' as const, name: 'foo', version: 'workspace:*' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved.version).toBe('3.0.1');
	});

	it('should support workspaces: { packages: ["packages/*"] } (object)', async () => {
		const dep = { ecosystem: 'js' as const, name: 'baz', version: 'workspace:*' };
		const resolved = await resolver(dep, { cwd: cwdObject });
		expect(resolved).toEqual({ ecosystem: 'js', name: 'baz', version: '2.0.0' });
	});

	it('should use options.cwd for discovery', async () => {
		const dep = { ecosystem: 'js' as const, name: 'foo', version: 'workspace:*' };
		const resolved = await resolver(dep, { cwd });
		expect(resolved.version).toBe('3.0.1');
	});

	it('should cache: multiple resolutions with same cwd do not re-parse', async () => {
		const dep1 = { ecosystem: 'js' as const, name: 'foo', version: 'workspace:*' };
		const dep2 = { ecosystem: 'js' as const, name: 'bar', version: 'workspace:*' };
		const r1 = await resolver(dep1, { cwd });
		const r2 = await resolver(dep2, { cwd });
		expect(r1.version).toBe('3.0.1');
		expect(r2.version).toBe('0.1.0');
	});
});
