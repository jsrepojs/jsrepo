import { assert, describe, expect, it } from 'vitest';
import type { DistributedOutputManifest } from '@/outputs';
import { DEFAULT_PROVIDERS } from '@/providers';
import {
	getTargetPath,
	normalizeItemTypeForPath,
	parseWantedItems,
	resolveTree,
	resolveWantedItems,
} from '@/utils/add';
import {
	MultipleRegistriesError,
	RegistryItemNotFoundError,
	RegistryNotProvidedError,
} from '@/utils/errors';

describe('parseWantedItems', () => {
	it('should parse fully qualified items', () => {
		const result = parseWantedItems(['@ieedan/std/result'], {
			providers: DEFAULT_PROVIDERS,
			registries: [],
		});

		assert(result.isOk());
		expect(result.value).toEqual({
			wantedItems: [
				{
					registryUrl: '@ieedan/std',
					itemName: 'result',
				},
			],
			neededRegistries: ['@ieedan/std'],
		});
	});

	it('should parse unqualified items', () => {
		const result = parseWantedItems(['result'], {
			providers: DEFAULT_PROVIDERS,
			registries: ['@ieedan/std'],
		});

		assert(result.isOk());
		expect(result.value).toEqual({
			wantedItems: [{ itemName: 'result' }],
			neededRegistries: ['@ieedan/std'],
		});
	});

	it('should error when it cannot determine the registry url', () => {
		const result = parseWantedItems(['math'], {
			providers: DEFAULT_PROVIDERS,
			registries: [],
		});

		assert(result.isErr());
		expect(result.error).toBeInstanceOf(RegistryNotProvidedError);
	});
});

describe('resolveWantedItems', () => {
	it('should resolve wanted items', async () => {
		const result = await resolveWantedItems(
			[
				{
					registryUrl: '@ieedan/std@beta',
					itemName: 'result',
				},
			],
			{
				resolvedRegistries: new Map([['@ieedan/std@beta', RESOLVED_REGISTRY]]),
				nonInteractive: true,
			}
		);

		assert(result.isOk());
		const wantedItem = result.value[0]!;
		expect(wantedItem.registry.url).toBe('@ieedan/std@beta');
		expect(wantedItem.item.name).toBe('result');
	});

	it('should error when the item is not found', async () => {
		const result = await resolveWantedItems(
			[
				{
					itemName: 'not-found',
				},
			],
			{
				resolvedRegistries: new Map([['@ieedan/std@beta', RESOLVED_REGISTRY]]),
				nonInteractive: true,
			}
		);

		assert(result.isErr());
		expect(result.error).toBeInstanceOf(RegistryItemNotFoundError);
	});

	it('should error when the item is not found in a specify registry', async () => {
		const result = await resolveWantedItems(
			[
				{
					registryUrl: '@ieedan/std@beta',
					itemName: 'not-found',
				},
			],
			{
				resolvedRegistries: new Map([['@ieedan/std@beta', RESOLVED_REGISTRY]]),
				nonInteractive: true,
			}
		);

		assert(result.isErr());
		expect(result.error).toBeInstanceOf(RegistryItemNotFoundError);
	});

	it('should error when there are multiple matches in non interactive mode', async () => {
		const result = await resolveWantedItems(
			[
				{
					itemName: 'result',
				},
			],
			{
				resolvedRegistries: new Map([
					['@ieedan/std@beta', RESOLVED_REGISTRY],
					['@ieedan/std2@beta', RESOLVED_REGISTRY],
				]),
				nonInteractive: true,
			}
		);

		assert(result.isErr());
		expect(result.error).toBeInstanceOf(MultipleRegistriesError);
	});
});

export const RESOLVED_REGISTRY = {
	url: '@ieedan/std@beta',
	provider: {
		state: {
			url: '@ieedan/std@beta',
			specifier: undefined,
			scope: '@ieedan',
			registryName: 'std',
			version: 'beta',
			baseUrl: 'https://www.jsrepo.com',
		},
		fetch: async () => {
			return '';
		},
		opts: {},
	},
	manifest: {
		name: '@ieedan/std',
		description: 'Fully tested and documented TypeScript utilities brokered by jsrepo.',
		version: '5.3.1-beta.0',
		homepage: 'https://ieedan.github.io/std/',
		tags: ['typescript', 'std', 'utilities'],
		repository: 'https://github.com/ieedan/std',
		bugs: 'https://github.com/ieedan/std/issues',
		authors: ['Aidan Bleser'],
		type: 'distributed',
		plugins: {
			languages: [],
			providers: [],
			transforms: [],
		},
		defaultPaths: {},
		items: [
			{
				name: 'result',
				type: 'util',
				registryDependencies: ['types'],
				add: 'when-added',
				dependencies: [],
				files: [
					{
						path: 'result.ts',
						type: undefined,
						target: undefined,
						registryDependencies: undefined,
						dependencies: undefined,
						devDependencies: undefined,
					},
					{
						path: 'result.test.ts',
						type: 'registry:test',
						target: undefined,
						registryDependencies: ['add'],
						dependencies: undefined,
						devDependencies: [{ ecosystem: 'js', name: 'vitest', version: undefined }],
					},
				],
				devDependencies: [],
				envVars: {},
				title: undefined,
				description: undefined,
			},
			{
				name: 'types',
				type: 'util',
				registryDependencies: [],
				add: 'when-added',
				dependencies: [],
				files: [
					{
						path: 'types.ts',
						type: undefined,
						target: undefined,
						registryDependencies: undefined,
						dependencies: undefined,
						devDependencies: undefined,
					},
				],
				devDependencies: [],
				envVars: {},
				title: undefined,
				description: undefined,
			},
			{
				name: 'add',
				type: 'util',
				registryDependencies: [],
				add: 'when-added',
				dependencies: [],
				files: [
					{
						path: 'add.ts',
						type: undefined,
						target: undefined,
						registryDependencies: undefined,
						dependencies: undefined,
						devDependencies: undefined,
					},
				],
				devDependencies: [],
				envVars: {},
				title: undefined,
				description: undefined,
			},
		],
	} satisfies DistributedOutputManifest,
};

describe('resolveTree', () => {
	it("should resolve the item and it's dependencies", () => {
		const result = resolveTree(
			[
				{
					registry: RESOLVED_REGISTRY,
					item: RESOLVED_REGISTRY.manifest.items[0]!,
				},
			],
			{
				options: {
					withExamples: false,
					withDocs: false,
					withTests: false,
				},
				resolvedItems: new Map(),
			}
		);

		assert(result.isOk());

		expect(result.value[0]!.name).toBe('types');
		expect(result.value[1]!.name).toBe('result');
	});

	it('should resolve the items dependencies and the optional file dependencies', () => {
		const result = resolveTree(
			[
				{
					registry: RESOLVED_REGISTRY,
					item: RESOLVED_REGISTRY.manifest.items[0]!,
				},
			],
			{
				options: {
					withExamples: false,
					withDocs: false,
					withTests: true,
				},
				resolvedItems: new Map(),
			}
		);

		assert(result.isOk());

		expect(result.value[0]!.name).toBe('types');
		expect(result.value[1]!.name).toBe('add');
		expect(result.value[2]!.name).toBe('result');
	});
});

describe('getTargetPath', () => {
	it('should get the target path for a distributed file', () => {
		const result = getTargetPath(
			{
				path: 'result.ts',
			},
			{
				itemPath: { path: 'src' },
				options: { cwd: '' },
			}
		);

		expect(result).toBe('src/result.ts');
	});

	it('should get the target path for a distributed file with a target path', () => {
		const result = getTargetPath(
			{
				path: 'result.ts',
				target: 'src/result/result.ts',
			},
			{
				itemPath: { path: 'src' },
				options: { cwd: '' },
			}
		);

		expect(result).toBe('src/result/result.ts');
	});

	it('should get the target path for a distributed file with a relative path', () => {
		const result = getTargetPath(
			{
				path: 'result.ts',
				relativePath: 'result.ts',
			},
			{
				itemPath: { path: 'src/result' },
				options: { cwd: '' },
			}
		);

		expect(result).toBe('src/result/result.ts');
	});
});

describe('normalizeItemTypeForPath', () => {
	it('should normalize prefixed item types', () => {
		expect(normalizeItemTypeForPath('registry:util')).toBe('util');
		expect(normalizeItemTypeForPath('registry:registry:util')).toBe('registry:util');
	});

	it('should not normalize unprefixed item types', () => {
		expect(normalizeItemTypeForPath('util')).toBe('util');
		expect(normalizeItemTypeForPath('blocks:registry:component')).toBe(
			'blocks:registry:component'
		);
	});
});
