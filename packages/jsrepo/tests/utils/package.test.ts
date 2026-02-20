import fs from 'node:fs';
import os from 'node:os';
import path from 'pathe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findNearestPackageJson, type PackageJson, shouldInstall } from '@/utils/package';

describe('shouldInstall', () => {
	it('should install dependencies not present in package.json', () => {
		const dependencies = {
			dependencies: [{ ecosystem: 'js', name: 'lodash', version: '4.17.21' }],
			devDependencies: [{ ecosystem: 'js', name: 'react', version: '18.0.0' }],
		};

		const pkg: Partial<PackageJson> = {
			dependencies: {},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual(dependencies);
	});

	it('should not install dependencies already present with satisfying versions', () => {
		const dependencies = {
			dependencies: [{ ecosystem: 'js', name: 'lodash', version: '4.17.21' }],
			devDependencies: [],
		};

		const pkg: Partial<PackageJson> = {
			dependencies: {
				lodash: '^4.17.21',
			},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual({ dependencies: [], devDependencies: [] });
	});

	it('should install dependencies with newer versions', () => {
		const dependencies = {
			dependencies: [{ ecosystem: 'js', name: 'lodash', version: '5.0.0' }],
			devDependencies: [],
		};

		const pkg: Partial<PackageJson> = {
			dependencies: {
				lodash: '^4.17.20',
			},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual({
			dependencies: [{ ecosystem: 'js', name: 'lodash', version: '5.0.0' }],
			devDependencies: [],
		});
	});

	it('should handle dev dependencies correctly', () => {
		const dependencies = {
			dependencies: [],
			devDependencies: [{ ecosystem: 'js', name: 'jest', version: '29.0.0' }],
		};

		const pkg: Partial<PackageJson> = {
			devDependencies: {
				jest: '^28.0.0',
			},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual({
			dependencies: [],
			devDependencies: [{ ecosystem: 'js', name: 'jest', version: '29.0.0' }],
		});
	});

	it('should not install dev dependencies already present with satisfying versions', () => {
		const dependencies = {
			dependencies: [],
			devDependencies: [{ ecosystem: 'js', name: 'jest', version: '28.5.0' }],
		};

		const pkg: Partial<PackageJson> = {
			devDependencies: {
				jest: '^28.5.0',
			},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual({
			dependencies: [],
			devDependencies: [],
		});
	});

	it('should skip dependencies with undefined version if they exist', () => {
		const dependencies = {
			dependencies: [{ ecosystem: 'js', name: 'lodash', version: undefined }],
			devDependencies: [],
		};

		const pkg: Partial<PackageJson> = {
			dependencies: {
				lodash: '^4.17.20',
			},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual({
			dependencies: [],
			devDependencies: [],
		});
	});

	it("should install dependencies with undefined version if they don't exist", () => {
		const dependencies = {
			dependencies: [{ ecosystem: 'js', name: 'lodash', version: undefined }],
			devDependencies: [],
		};

		const pkg: Partial<PackageJson> = {
			dependencies: {},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual(dependencies);
	});

	it('should handle duplicate dependencies by keeping the last one', () => {
		const dependencies = {
			dependencies: [
				{ ecosystem: 'js', name: 'lodash', version: '4.17.20' },
				{ ecosystem: 'js', name: 'lodash', version: '4.17.21' },
			],
			devDependencies: [],
		};

		const pkg: Partial<PackageJson> = {
			dependencies: {},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual({
			dependencies: [{ ecosystem: 'js', name: 'lodash', version: '4.17.21' }],
			devDependencies: [],
		});
	});
});

describe('findNearestPackageJson', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should find the nearest package.json', () => {
		const fixtureDir = path.join(__dirname, '../fixtures/langs/js') as Parameters<
			typeof findNearestPackageJson
		>[0];
		const result = findNearestPackageJson(fixtureDir);
		expect(result).toBeDefined();
		expect(result?.package).toBeDefined();
	});

	it('should return the same reference on repeated calls (cache hit)', () => {
		const fixtureDir = path.join(__dirname, '../fixtures/langs/js') as Parameters<
			typeof findNearestPackageJson
		>[0];
		const first = findNearestPackageJson(fixtureDir);
		const second = findNearestPackageJson(fixtureDir);
		expect(first).toBe(second);
	});

	it('should return undefined when no package.json exists up to the root', () => {
		const existsSyncSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
		const fakeDir = path.join(os.homedir(), 'fake-no-pkg-dir') as Parameters<
			typeof findNearestPackageJson
		>[0];
		const result = findNearestPackageJson(fakeDir);
		expect(result).toBeUndefined();
		existsSyncSpy.mockRestore();
	});

	it('should cache a miss (undefined) and not re-walk the filesystem', () => {
		const existsSyncSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
		const fakeDir = path.join(os.homedir(), 'fake-cached-miss-dir') as Parameters<
			typeof findNearestPackageJson
		>[0];

		const first = findNearestPackageJson(fakeDir);
		const callsAfterFirst = existsSyncSpy.mock.calls.length;

		const second = findNearestPackageJson(fakeDir);
		expect(second).toBeUndefined();
		expect(first).toBe(second);
		expect(existsSyncSpy.mock.calls.length).toBe(callsAfterFirst);
	});
});
