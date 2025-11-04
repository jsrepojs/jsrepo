import { describe, expect, it } from 'vitest';
import type { RemoteDependency } from '@/utils/build';
import { type PackageJson, shouldInstall } from '@/utils/package';

describe('shouldInstall', () => {
	it('should install dependencies not present in package.json', () => {
		const dependencies: RemoteDependency[] = [
			{ ecosystem: 'js', name: 'lodash', version: '4.17.21', dev: false },
			{ ecosystem: 'js', name: 'react', version: '18.0.0', dev: false },
		];

		const pkg: Partial<PackageJson> = {
			dependencies: {},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual(dependencies);
	});

	it('should not install dependencies already present with satisfying versions', () => {
		const dependencies: RemoteDependency[] = [
			{ ecosystem: 'js', name: 'lodash', version: '4.17.21', dev: false },
		];

		const pkg: Partial<PackageJson> = {
			dependencies: {
				lodash: '^4.17.21',
			},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual([]);
	});

	it('should install dependencies with newer versions', () => {
		const dependencies: RemoteDependency[] = [
			{ ecosystem: 'js', name: 'lodash', version: '5.0.0', dev: false },
		];

		const pkg: Partial<PackageJson> = {
			dependencies: {
				lodash: '^4.17.20',
			},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual(dependencies);
	});

	it('should handle dev dependencies correctly', () => {
		const dependencies: RemoteDependency[] = [
			{ ecosystem: 'js', name: 'jest', version: '29.0.0', dev: true },
		];

		const pkg: Partial<PackageJson> = {
			devDependencies: {
				jest: '^28.0.0',
			},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual(dependencies);
	});

	it('should not install dev dependencies already present with satisfying versions', () => {
		const dependencies: RemoteDependency[] = [
			{ ecosystem: 'js', name: 'jest', version: '28.5.0', dev: true },
		];

		const pkg: Partial<PackageJson> = {
			devDependencies: {
				jest: '^28.5.0',
			},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual([]);
	});

	it('should skip dependencies with undefined version if they exist', () => {
		const dependencies: RemoteDependency[] = [
			{ ecosystem: 'js', name: 'lodash', version: undefined, dev: false },
		];

		const pkg: Partial<PackageJson> = {
			dependencies: {
				lodash: '^4.17.20',
			},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual([]);
	});

	it("should install dependencies with undefined version if they don't exist", () => {
		const dependencies: RemoteDependency[] = [
			{ ecosystem: 'js', name: 'lodash', version: undefined, dev: false },
		];

		const pkg: Partial<PackageJson> = {
			dependencies: {},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual(dependencies);
	});

	it('should handle duplicate dependencies by keeping the last one', () => {
		const dependencies: RemoteDependency[] = [
			{ ecosystem: 'js', name: 'lodash', version: '4.17.20', dev: false },
			{ ecosystem: 'js', name: 'lodash', version: '4.17.21', dev: false },
		];

		const pkg: Partial<PackageJson> = {
			dependencies: {},
		};

		const result = shouldInstall(dependencies, { pkg });

		expect(result).toEqual([
			{ ecosystem: 'js', name: 'lodash', version: '4.17.21', dev: false },
		]);
	});
});
