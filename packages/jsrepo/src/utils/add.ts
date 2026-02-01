import { cancel, isCancel, select, text } from '@clack/prompts';
import { diffLines } from 'diff';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import { DEFAULT_LANGS, type Language } from '@/langs';
import type { Manifest } from '@/outputs';
import {
	type DistributedOutputItem,
	DistributedOutputItemSchema,
	type DistributedOutputManifestFile,
} from '@/outputs/distributed';
import type { RepositoryOutputFile } from '@/outputs/repository';
import { fetchManifest, type Provider, type ProviderFactory } from '@/providers';
import type { DependencyKey, RemoteDependency, UnresolvedImport } from '@/utils/build';
import type { Config, RegistryItemAdd, RegistryItemType } from '@/utils/config';
import { getPathsMatcher, resolvePath, resolvePaths } from '@/utils/config/utils';
import { formatDiff } from '@/utils/diff';
import type { PathsMatcher } from '@/utils/tsconfig';
import { safeParseFromJSON } from '@/utils/zod';
import {
	InvalidDependencyError,
	type InvalidJSONError,
	InvalidRegistryError,
	type JsrepoError,
	type ManifestFetchError,
	MultipleRegistriesError,
	NoPathProvidedError,
	ProviderFetchError,
	RegistryFileFetchError,
	RegistryItemFetchError,
	RegistryItemNotFoundError,
	RegistryNotProvidedError,
	Unreachable,
	type ZodError,
} from './errors';
import { existsSync, readFileSync, writeFileSync } from './fs';
import { parsePackageName } from './parse-package-name';
import { joinAbsolute } from './path';
import { VERTICAL_LINE } from './prompts';
import { TokenManager } from './token-manager';
import type { AbsolutePath, ItemRelativePath } from './types';

export type ResolvedRegistry = {
	url: string;
	provider: Provider;
	manifest: Manifest;
	token?: string;
};

/**
 * Resolves each registry url to it's manifest and provider so we can start fetching items.
 *
 * @param registries - An array of registry urls to resolve. i.e. ["github/ieedan/std", "gitlab/ieedan/std"]
 * @param options
 * @returns
 */
export async function resolveRegistries(
	registries: string[],
	{ cwd, providers }: { cwd: AbsolutePath; providers: ProviderFactory[] }
): Promise<
	Result<
		Map<string, ResolvedRegistry>,
		InvalidRegistryError | ManifestFetchError | InvalidJSONError | ZodError
	>
> {
	if (registries.length === 0) return ok(new Map());
	const tokenManager = new TokenManager();
	const resolvedRegistries: Result<
		ResolvedRegistry,
		InvalidRegistryError | ManifestFetchError | InvalidJSONError | ZodError
	>[] = await Promise.all(
		registries.map(async (registry) => {
			const pf = providers.find((p) => p?.matches(registry));
			if (!pf) return err(new InvalidRegistryError(registry));
			const token = tokenManager.get(pf, registry);
			const provider = await pf?.create(registry, { cwd, token });
			const manifestResult = await fetchManifest(provider, { token });
			if (manifestResult.isErr()) return err(manifestResult.error);
			return ok({ url: registry, provider, manifest: manifestResult.value, token });
		})
	);
	const resultMap = new Map<string, ResolvedRegistry>();
	for (const result of resolvedRegistries) {
		if (result.isErr()) return err(result.error);
		resultMap.set(result.value.url, result.value);
	}
	return ok(resultMap);
}

export type WantedItem = {
	registryUrl?: string;
	itemName: string;
};

/**
 * Parses the wanted items and needed registries from an array of fully-qualified and or unqualified items.
 *
 * @remarks this only parses the items and does not actually resolve the items or registries
 *
 * @param items - An array of fully-qualified and or unqualified items. i.e. ["github/ieedan/std", "gitlab/ieedan/std", "math"]
 * @param options
 * @returns
 */
export function parseWantedItems(
	items: string[],
	{ providers, registries }: { providers: ProviderFactory[]; registries: string[] }
): Result<{ wantedItems: WantedItem[]; neededRegistries: string[] }, RegistryNotProvidedError> {
	const wantedItems: WantedItem[] = items.map((item) => {
		if (providers.some((p) => p.matches(item))) {
			const index = item.lastIndexOf('/');
			const registryUrl = item.substring(0, index);
			const itemName = item.substring(index + 1);
			return {
				registryUrl,
				itemName,
			};
		}
		return {
			itemName: item,
		};
	});

	const allFullyQualified = wantedItems.every((item) => item.registryUrl);
	const noneFullyQualified = wantedItems.every((item) => item.registryUrl === undefined);
	const wantedRegistries = wantedItems
		.filter((item) => item.registryUrl !== undefined)
		.map((item) => item.registryUrl!);

	// can't have unqualified items if no registries are provided
	if (noneFullyQualified && registries.length === 0) return err(new RegistryNotProvidedError());

	return ok({
		wantedItems,
		neededRegistries: [...wantedRegistries, ...(allFullyQualified ? [] : registries)],
	});
}

export type ResolvedWantedItem = {
	registry: ResolvedRegistry;
	item: {
		name: string;
		description: string | undefined;
		add: RegistryItemAdd | undefined;
		type: RegistryItemType;
		registryDependencies: string[] | undefined;
		dependencies: (RemoteDependency | string)[] | undefined;
		devDependencies: (RemoteDependency | string)[] | undefined;
		files: Array<RepositoryOutputFile | DistributedOutputManifestFile>;
		envVars: Record<string, string> | undefined;
		categories: string[] | undefined;
		meta: Record<string, string> | undefined;
	};
};

/**
 * Resolve the wanted items to the resolved registry. This will ask the user to select a registry if there are multiple matches to remove an ambiguity.
 * @remarks The only async "work" that should be done here is waiting for the user to respond
 * @param wantedItems
 * @param options
 */
export async function resolveWantedItems(
	wantedItems: WantedItem[],
	{
		resolvedRegistries,
		nonInteractive,
	}: { resolvedRegistries: Map<string, ResolvedRegistry>; nonInteractive: boolean }
): Promise<Result<ResolvedWantedItem[], MultipleRegistriesError | RegistryItemNotFoundError>> {
	const resolvedWantedItems: ResolvedWantedItem[] = [];
	for (const wantedItem of wantedItems) {
		let resolvedRegistry: ResolvedRegistry;
		let resolvedItem: ResolvedWantedItem['item'];

		if (wantedItem.registryUrl) {
			resolvedRegistry = resolvedRegistries.get(wantedItem.registryUrl)!;

			const item = resolvedRegistry.manifest.items.find(
				(i) => i.name === wantedItem.itemName
			);
			if (!item) {
				return err(
					new RegistryItemNotFoundError(wantedItem.itemName, resolvedRegistry.url)
				);
			}
			resolvedItem = { ...item, add: item.add ?? 'when-added' };
		} else {
			const blockMatches = new Map<
				string,
				{ registry: ResolvedRegistry; item: ResolvedWantedItem['item'] }
			>();
			for (const [url, registry] of resolvedRegistries.entries()) {
				const item = registry.manifest.items.find((i) => i.name === wantedItem.itemName);
				if (item)
					blockMatches.set(url, {
						registry,
						item,
					});
			}

			if (blockMatches.size === 0) {
				return err(new RegistryItemNotFoundError(wantedItem.itemName));
			}

			if (blockMatches.size > 1) {
				if (nonInteractive)
					return err(
						new MultipleRegistriesError(
							wantedItem.itemName,
							Array.from(blockMatches.keys())
						)
					);

				const response = await select({
					message: `Multiple registries contain ${pc.cyan(wantedItem.itemName)}. Please select one:`,
					options: Array.from(blockMatches.entries()).map(([url]) => ({
						label: wantedItem.itemName,
						value: url,
						hint: url,
					})),
				});

				if (isCancel(response)) {
					cancel('Canceled!');
					process.exit(0);
				}

				const { registry, item } = blockMatches.get(response)!;

				resolvedRegistry = registry;
				resolvedItem = item;
			} else {
				const { registry, item } = blockMatches.values().next().value!;
				resolvedRegistry = registry;
				resolvedItem = item;
			}
		}

		resolvedWantedItems.push({ registry: resolvedRegistry, item: resolvedItem });
	}

	return ok(resolvedWantedItems);
}

export type ResolvedItem = {
	name: string;
	description: string | undefined;
	add: RegistryItemAdd | undefined;
	type: RegistryItemType;
	registryDependencies: string[] | undefined;
	dependencies: (RemoteDependency | string)[] | undefined;
	devDependencies: (RemoteDependency | string)[] | undefined;
	registry: ResolvedRegistry;
	files: Array<RepositoryOutputFile | DistributedOutputManifestFile>;
	envVars: Record<string, string> | undefined;
	categories: string[] | undefined;
	meta: Record<string, string> | undefined;
};

export type ItemRepository = {
	name: string;
	type: RegistryItemType;
	add: RegistryItemAdd | undefined;
	description: string | undefined;
	dependencies: (RemoteDependency | string)[] | undefined;
	devDependencies: (RemoteDependency | string)[] | undefined;
	registry: ResolvedRegistry;
	files: Array<RepositoryOutputFile & { content: string }>;
	envVars: Record<string, string> | undefined;
	categories: string[] | undefined;
	meta: Record<string, string> | undefined;
};

export type ItemDistributed = DistributedOutputItem & { registry: ResolvedRegistry };

export async function fetchItem(block: ResolvedItem) {
	try {
		const contents = await block.registry.provider.fetch(`${block.name}.json`, {
			token: block.registry.token,
		});

		return safeParseFromJSON(DistributedOutputItemSchema, contents);
	} catch (e) {
		return err(
			new RegistryItemFetchError(e, {
				registry: block.registry.url,
				item: block.name,
			})
		);
	}
}

export async function fetchFile(fileName: string, block: ResolvedItem) {
	try {
		return ok(await block.registry.provider.fetch(fileName, { token: block.registry.token }));
	} catch (error) {
		if (error instanceof ProviderFetchError)
			return err(
				new RegistryFileFetchError(error.originalMessage, {
					registry: block.registry.url,
					item: block.name,
					resourcePath: error.resourcePath,
				})
			);
		return err(
			new RegistryFileFetchError(error instanceof Error ? error.message : String(error), {
				registry: block.registry.url,
				item: block.name,
				resourcePath: fileName,
			})
		);
	}
}

/**
 * Fetches an item from the registry in repository mode.
 *
 * @param item
 * @param options
 * @returns
 */
async function fetchItemRepositoryMode(
	item: ResolvedItem
): Promise<Result<ItemRepository, RegistryFileFetchError>> {
	const files = await Promise.all(
		(item.files as RepositoryOutputFile[]).map(async (file) => {
			const result = await fetchFile(file.relativePath, item);
			if (result.isErr()) return err(result.error);
			return ok({
				...file,
				content: result.value,
			});
		})
	);

	const filesResult = [];
	for (const file of files) {
		if (file.isErr()) return err(file.error);
		filesResult.push(file.value);
	}

	return ok({
		name: item.name,
		type: item.type,
		add: item.add,
		description: item.description,
		dependencies: item.dependencies,
		devDependencies: item.devDependencies,
		registry: item.registry,
		files: filesResult,
		envVars: item.envVars,
		categories: item.categories,
		meta: item.meta,
	});
}

/**
 * Fetches an item from the registry in distributed mode.
 *
 * @param item
 * @param options
 * @returns
 */
async function fetchItemDistributedMode(
	item: ResolvedItem
): Promise<Result<ItemDistributed, RegistryItemFetchError | InvalidJSONError>> {
	const result = await fetchItem(item);
	if (result.isErr()) return err(result.error);
	return ok({
		...result.value,
		files: result.value.files.map((file) => ({
			...file,
			path:
				// this is a weird compat thing.
				// shadcn/ui has the full path to the file even though the client only needs the basename
				result.value.$schema === 'https://ui.shadcn.com/schema/registry-item.json'
					? (path.basename(file.path) as ItemRelativePath)
					: file.path,
		})),
		registry: item.registry,
	});
}

type ExtractResultValue<T> = T extends Result<infer V, unknown> ? V : never;

export async function fetchAllResolvedItems(
	items: ResolvedItem[]
): Promise<
	Result<
		Array<ItemRepository | ItemDistributed>,
		RegistryItemFetchError | RegistryFileFetchError | InvalidJSONError
	>
> {
	const itemsResult = await Promise.all(
		items.map(async (item) => {
			if (item.registry.manifest.type === 'repository') {
				return await fetchItemRepositoryMode(item);
			}

			return await fetchItemDistributedMode(item);
		})
	);

	const finalItems = [];
	for (const item of itemsResult) {
		if (item.isErr()) return err(item.error);
		finalItems.push(item.value);
	}

	return ok(finalItems);
}

/**
 * Tries to get the path for an item. If the path is not set, it will prompt the user for a path.
 *
 * @remarks the only async "work" is prompting the user for a path if they don't have a path set.
 *
 * @param item
 * @param param1
 * @returns
 */
export async function getItemLocation(
	item: {
		name: string;
		type: RegistryItemType;
		files: { path: string; target?: string }[];
		registry: ResolvedRegistry;
	},
	{
		paths,
		nonInteractive,
		options,
		matcher,
	}: {
		paths: Config['paths'];
		nonInteractive: boolean;
		options: { cwd: string };
		matcher: PathsMatcher;
	}
): Promise<Result<{ resolvedPath: string; path: string }, NoPathProvidedError>> {
	// if all the files are just target files we don't need to prompt the user for a path
	if (item.files.filter((file) => file.target !== undefined).length === item.files.length) {
		return ok({
			path: '',
			resolvedPath: '',
		});
	}

	const catchAllPath = paths['*'];
	const type = normalizeItemTypeForPath(item.type);
	const path = paths[type];
	if (!path) {
		if (catchAllPath) {
			return ok({
				path: catchAllPath,
				// already resolved
				resolvedPath: catchAllPath,
			});
		}

		// we just error in non-interactive mode
		if (nonInteractive) return err(new NoPathProvidedError({ item: item.name, type }));

		const defaultPath = item.registry.manifest.defaultPaths?.[type] ?? `./src/${type}`;

		const blocksPath = await text({
			message: `Where would you like to add ${pc.cyan(type)}?`,
			placeholder: defaultPath,
			initialValue: defaultPath,
			defaultValue: defaultPath,
			validate(value) {
				if (!value || value.trim() === '') return 'Please provide a value';
			},
		});

		if (isCancel(blocksPath)) {
			cancel('Canceled!');
			process.exit(0);
		}

		return ok({
			path: blocksPath,
			resolvedPath: resolvePath(blocksPath, { cwd: options.cwd, matcher }),
		});
	}
	return ok({ path, resolvedPath: path });
}

export type FetchedItem = ExtractResultValue<
	Awaited<ReturnType<typeof fetchAllResolvedItems>>
>[number];

export type FileWithContents = ExtractResultValue<
	Awaited<ReturnType<typeof fetchAllResolvedItems>>
>[number]['files'][number];

export async function transformRemoteContent(
	file: FileWithContents,
	{
		item,
		options,
		config,
	}: {
		item: FetchedItem;
		languages: Language[];
		options: { cwd: AbsolutePath };
		config: Config | undefined;
		itemPaths: Record<string, { path: string; alias?: string }>;
	}
): Promise<FileWithContents> {
	for (const transform of config?.transforms ?? []) {
		const result = await transform.transform({
			code: file.content,
			fileName: file.path,
			options: {
				cwd: options.cwd,
				registryUrl: item.registry.url,
				item: item,
			},
		});
		file.content = result.code ?? file.content;
		file.path = result.fileName ?? file.path;
	}

	return file;
}

export function getTargetPath(
	file: { path: ItemRelativePath; target?: string },
	{
		itemPath,
		options,
	}: {
		itemPath: { path: string };
		options: { cwd: AbsolutePath };
	}
): AbsolutePath {
	if (file.target) {
		return joinAbsolute(options.cwd, file.target);
	} else {
		return joinAbsolute(options.cwd, itemPath.path, file.path);
	}
}

export type RegistryItemWithContent = ItemRepository | ItemDistributed;

export async function resolveAndFetchAllItems(
	wantedItems: ResolvedWantedItem[],
	{
		options,
	}: {
		options: { withExamples: boolean; withDocs: boolean; withTests: boolean };
	}
): Promise<
	Result<
		Array<RegistryItemWithContent>,
		| RegistryItemNotFoundError
		| RegistryItemFetchError
		| RegistryFileFetchError
		| InvalidJSONError
	>
> {
	const resolvedResult = resolveTree(wantedItems, { resolvedItems: new Map(), options });
	if (resolvedResult.isErr()) return err(resolvedResult.error);
	const resolvedItems = resolvedResult.value;

	const itemsResult = await fetchAllResolvedItems(resolvedItems);
	if (itemsResult.isErr()) return err(itemsResult.error);
	const items = itemsResult.value;

	return ok(items);
}

/**
 * Recursively resolves the tree of wanted items and their dependencies.
 *
 * @param wantedItems - The wanted items to resolve.
 * @param options
 * @returns
 */
export function resolveTree(
	wantedItems: ResolvedWantedItem[],
	{
		resolvedItems,
		options,
	}: {
		resolvedItems: Map<string, ResolvedItem>;
		options: { withExamples: boolean; withDocs: boolean; withTests: boolean };
	}
): Result<ResolvedItem[], RegistryItemNotFoundError> {
	for (const wantedItem of wantedItems) {
		if (resolvedItems.has(wantedItem.item.name)) continue;

		const needsResolving: ResolvedWantedItem[] = [];
		for (const registryDependency of wantedItem.item.registryDependencies ?? []) {
			if (resolvedItems.has(registryDependency)) continue;
			const item = wantedItem.registry.manifest.items.find(
				(i) => i.name === registryDependency
			);
			if (!item)
				return err(
					new RegistryItemNotFoundError(registryDependency, wantedItem.registry.url)
				);
			needsResolving.push({
				registry: wantedItem.registry,
				item,
			});
		}

		// ensure we also add any registry dependencies of added files
		for (const file of wantedItem.item.files) {
			if (file.role === 'example' && !options.withExamples) continue;
			if (file.role === 'doc' && !options.withDocs) continue;
			if (file.role === 'test' && !options.withTests) continue;

			for (const registryDependency of file.registryDependencies ?? []) {
				if (resolvedItems.has(registryDependency)) continue;
				const item = wantedItem.registry.manifest.items.find(
					(i) => i.name === registryDependency
				);
				if (!item)
					return err(
						new RegistryItemNotFoundError(registryDependency, wantedItem.registry.url)
					);
				needsResolving.push({
					registry: wantedItem.registry,
					item,
				});
			}
		}

		resolvedItems.set(wantedItem.item.name, {
			name: wantedItem.item.name,
			type: wantedItem.item.type,
			description: wantedItem.item.description,
			add: wantedItem.item.add,
			registryDependencies: wantedItem.item.registryDependencies,
			dependencies: wantedItem.item.dependencies,
			devDependencies: wantedItem.item.devDependencies,
			registry: wantedItem.registry,
			files: wantedItem.item.files,
			envVars: wantedItem.item.envVars,
			categories: wantedItem.item.categories,
			meta: wantedItem.item.meta,
		});

		const resolvedRegistryDependencies = resolveTree(needsResolving, {
			resolvedItems,
			options,
		});
		if (resolvedRegistryDependencies.isErr()) return err(resolvedRegistryDependencies.error);
		for (const resolvedItem of resolvedRegistryDependencies.value) {
			resolvedItems.set(resolvedItem.name, resolvedItem);
		}
	}
	return ok(Array.from(resolvedItems.values()));
}

export async function getPathsForItems({
	items,
	config,
	options,
	continueOnNoPath = false,
}: {
	items: {
		name: string;
		type: RegistryItemType;
		files: { path: ItemRelativePath; type: RegistryItemType; target?: string }[];
		registry: ResolvedRegistry;
	}[];
	config: Config | undefined;
	options: { cwd: AbsolutePath; yes: boolean };
	continueOnNoPath?: boolean;
}): Promise<
	Result<
		{
			itemPaths: Record<string, { path: string; alias?: string }>;
			resolvedPaths: Config['paths'];
			updatedPaths: Record<string, string>;
		},
		NoPathProvidedError
	>
> {
	const pathsMatcher = getPathsMatcher({ cwd: options.cwd });

	const resolvedPaths = resolvePaths(config?.paths ?? {}, {
		cwd: options.cwd,
		matcher: pathsMatcher,
	});
	const updatedPaths: Record<string, string> = {};
	// get any paths that are not already set
	for (const item of items) {
		const uniqueTypes = Array.from(
			new Set(Array.from(item.files, (file) => normalizeItemTypeForPath(file.type)))
		);
		for (const type of uniqueTypes) {
			const itemPath = resolvedPaths[`${type}/${item.name}`];
			const typePath = resolvedPaths[type];
			if (itemPath !== undefined) {
				resolvedPaths[`${type}/${item.name}`] = itemPath;
				continue;
			}
			if (typePath !== undefined) {
				resolvedPaths[type] = typePath;
				continue;
			}
			const result = await getItemLocation(item, {
				paths: resolvedPaths,
				nonInteractive: options.yes,
				options,
				matcher: pathsMatcher,
			});
			if (result.isErr()) {
				if (result.error instanceof NoPathProvidedError && continueOnNoPath) {
					continue;
				}
				return err(result.error);
			}
			const { path: originalPath, resolvedPath } = result.value;
			resolvedPaths[type] = resolvedPath;
			updatedPaths[type] = originalPath;
			if (config) {
				config.paths[type] = originalPath;
			}
		}
	}

	const itemPaths = getItemPaths(items, resolvedPaths, { config });

	return ok({ itemPaths, resolvedPaths, updatedPaths });
}

export function getItemPaths(
	items: {
		name: string;
		type: RegistryItemType;
		files: { path: ItemRelativePath; type: RegistryItemType; target?: string }[];
	}[],
	resolvedPaths: Config['paths'],
	{
		config,
	}: {
		config: Config | undefined;
	}
): Record<
	string,
	{
		path: string;
		alias?: string;
	}
> {
	const itemPaths = items.reduce(
		(acc, item) => {
			for (const file of item.files) {
				const type = normalizeItemTypeForPath(file.type);

				const itemPath = resolvedPaths[`${type}/${item.name}`];
				const itemAlias =
					config?.paths[`${type}/${item.name}`] &&
					config.paths[`${type}/${item.name}`] !== itemPath
						? config.paths[`${type}/${item.name}`]
						: undefined;

				const typePath = resolvedPaths[type];
				const typeAlias =
					config?.paths[type] && config.paths[type] !== typePath
						? config.paths[type]
						: undefined;

				acc[`${type}/${item.name}`] = itemPath
					? { path: itemPath, alias: itemAlias }
					: // at this point we know that the type must be defined
						{ path: typePath!, alias: typeAlias! };
			}

			return acc;
		},
		{} as Record<
			string,
			{
				path: string;
				alias?: string;
			}
		>
	);

	for (const [key, value] of Object.entries(resolvedPaths)) {
		// we only care about type only paths
		if (key.includes('/')) continue;
		// just rename for readability
		const type = key;

		const typePath = value;
		const typeAlias =
			config?.paths[type] && config.paths[type] !== typePath ? config.paths[type] : undefined;

		// let's also make sure we just add the straight type path if it's defined
		if (typePath) {
			itemPaths[type] = { path: typePath, alias: typeAlias };
		}
	}

	return itemPaths;
}

export type UpdatedFile = {
	itemName: string;
	registryUrl: string;
	_imports_: UnresolvedImport[];
	filePath: AbsolutePath;
	newPath: ItemRelativePath;
	originalPath: ItemRelativePath;
	content: string;
	fileType: RegistryItemType;
} & (
	| {
			type: 'update';
			oldContent: string;
	  }
	| {
			type: 'create';
	  }
);

/**
 * Prepares updates for the items without applying them. This will transform the files and collect any dependencies and env vars needed.
 *
 * @param param0
 * @returns
 */
export async function prepareUpdates({
	items,
	itemPaths,
	configResult,
	options,
}: {
	configResult: { path: string; config: Config } | null;
	options: {
		cwd: AbsolutePath;
		yes: boolean;
		withExamples: boolean;
		withDocs: boolean;
		withTests: boolean;
	};
	itemPaths: Record<string, { path: string; alias?: string }>;
	items: (ItemRepository | ItemDistributed)[];
}): Promise<
	Result<
		{
			neededDependencies: {
				dependencies: RemoteDependency[];
				devDependencies: RemoteDependency[];
			};
			neededEnvVars: Record<string, string> | undefined;
			neededFiles: UpdatedFile[];
		},
		InvalidDependencyError
	>
> {
	const neededFiles: UpdatedFile[] = [];
	const neededDependencies = new Map<DependencyKey, RemoteDependency>();
	const neededDevDependencies = new Map<DependencyKey, RemoteDependency>();
	let neededEnvVars: Record<string, string> | undefined;

	for (const item of items) {
		for (let file of item.files) {
			if (file.role === 'example' && !options.withExamples) continue;
			if (file.role === 'doc' && !options.withDocs) continue;
			if (file.role === 'test' && !options.withTests) continue;

			const type = normalizeItemTypeForPath(file.type);
			const expectedPath = itemPaths[`${type}/${item.name}`]!;

			const originalPath = file.path;

			file = await transformRemoteContent(file, {
				item,
				languages: configResult?.config.languages ?? DEFAULT_LANGS,
				options,
				config: configResult?.config,
				itemPaths,
			});

			for (const dependency of file.dependencies ?? []) {
				neededDependencies.set(
					`${dependency.ecosystem}:${dependency.name}@${dependency.version}`,
					dependency
				);
			}
			for (const dependency of file.devDependencies ?? []) {
				neededDevDependencies.set(
					`${dependency.ecosystem}:${dependency.name}@${dependency.version}`,
					dependency
				);
			}

			const filePath = getTargetPath(file, { itemPath: expectedPath, options });

			// check if the file needs to be updated
			if (existsSync(filePath)) {
				const originalContents = readFileSync(filePath)._unsafeUnwrap();

				if (originalContents === file.content) {
					continue;
				}

				neededFiles.push({
					type: 'update',
					fileType: file.type,
					oldContent: originalContents,
					_imports_: file._imports_ ?? [],
					filePath,
					newPath: file.path,
					originalPath,
					content: file.content,
					itemName: item.name,
					registryUrl: item.registry.url,
				});
			} else {
				neededFiles.push({
					type: 'create',
					fileType: file.type,
					_imports_: file._imports_ ?? [],
					filePath,
					newPath: file.path,
					originalPath,
					content: file.content,
					itemName: item.name,
					registryUrl: item.registry.url,
				});
			}
		}

		// add any dependencies
		for (const remoteDependency of item.dependencies ?? []) {
			if (typeof remoteDependency === 'string') {
				const parsedResult = parsePackageName(remoteDependency);
				if (parsedResult.isErr())
					return err(
						new InvalidDependencyError({
							dependency: remoteDependency,
							registryName: item.registry.url,
							itemName: item.name,
						})
					);
				const parsed = parsedResult.value;
				// assume js ecosystem for string deps
				neededDependencies.set(`js:${parsed.name}@${parsed.version}`, {
					ecosystem: 'js',
					name: parsed.name,
					version: parsed.version,
				});
			} else {
				neededDependencies.set(
					`${remoteDependency.ecosystem}:${remoteDependency.name}@${remoteDependency.version}`,
					remoteDependency
				);
			}
		}

		for (const remoteDevDependency of item.devDependencies ?? []) {
			if (typeof remoteDevDependency === 'string') {
				const parsedResult = parsePackageName(remoteDevDependency);
				if (parsedResult.isErr())
					return err(
						new InvalidDependencyError({
							dependency: remoteDevDependency,
							registryName: item.registry.url,
							itemName: item.name,
						})
					);
				const parsed = parsedResult.value;
				// assume js ecosystem for string deps
				neededDevDependencies.set(`js:${parsed.name}@${parsed.version}`, {
					ecosystem: 'js',
					name: parsed.name,
					version: parsed.version,
				});
			} else {
				neededDevDependencies.set(
					`${remoteDevDependency.ecosystem}:${remoteDevDependency.name}@${remoteDevDependency.version}`,
					remoteDevDependency
				);
			}
		}

		// add any env vars
		for (const [name, value] of Object.entries(item.envVars ?? {})) {
			if (neededEnvVars === undefined) {
				neededEnvVars = {};
			}
			neededEnvVars[name] = value;
		}
	}

	// transform the imports for each file
	for (const file of neededFiles) {
		// update _imports_ so that they reference the transformed file path
		const newImports: UnresolvedImport[] = [];
		for (const imp of file._imports_ ?? []) {
			const targetFile = neededFiles.find(
				(f) =>
					f.originalPath === imp.file.path &&
					imp.item === f.itemName &&
					f.fileType === imp.file.type
			);
			if (!targetFile) {
				newImports.push(imp);
				continue;
			}

			newImports.push({
				import: imp.import,
				item: imp.item,
				file: { type: imp.file.type, path: targetFile.newPath },
				meta: imp.meta,
			});
		}

		const lang = configResult?.config.languages.find((lang) =>
			lang.canResolveDependencies(file.newPath)
		);
		file.content =
			(await lang?.transformImports(file.content, newImports, {
				cwd: options.cwd,
				targetPath: file.newPath,
				item: file.itemName,
				file: { type: file.fileType, path: file.newPath },
				getItemPath: ({ item, file }) => {
					const fileType = normalizeItemTypeForPath(file.type);
					// there are two types of paths
					// <type> and <type>/<name>
					for (const [key, value] of Object.entries(itemPaths)) {
						// <type>/<name>
						if (key === `${fileType}/${item}`) return value;

						// <type>
						if (key === fileType) return value;
					}
					// by now we should have already got all the necessary paths from the user
					throw new Unreachable();
				},
			})) ?? file.content;
	}

	return ok({
		neededDependencies: {
			dependencies: Array.from(neededDependencies.values()),
			devDependencies: Array.from(neededDevDependencies.values()),
		},
		neededEnvVars,
		neededFiles,
	});
}

export async function updateFiles({
	files,
	options,
}: {
	files: UpdatedFile[];
	options: {
		cwd: string;
		overwrite: boolean;
		expand: boolean;
		maxUnchanged: number;
	};
}): Promise<Result<string[], JsrepoError>> {
	const updatedFiles: string[] = [];
	for (const file of files) {
		if (file.type === 'create' || options.overwrite) {
			const writeResult = writeFileSync(file.filePath, file.content);
			if (writeResult.isErr()) return err(writeResult.error);
			updatedFiles.push(path.relative(options.cwd, file.filePath));
		} else {
			const changes = diffLines(file.oldContent, file.content);
			const relativePath = path.relative(options.cwd, file.filePath);
			const formattedDiff = formatDiff({
				from: `${file.registryUrl}/${file.itemName}`,
				to: relativePath,
				changes,
				expand: options.expand,
				maxUnchanged: options.maxUnchanged,
				prefix: () => `${VERTICAL_LINE}  `,
				onUnchanged: ({ from, to, prefix }) =>
					`${prefix?.() ?? ''}${pc.cyan(from)} → ${pc.gray(to)} ${pc.gray('(unchanged)')}\n`,
				intro: ({ from, to, changes, prefix }) => {
					const totalChanges = changes.filter((a) => a.added || a.removed).length;

					return `${prefix?.() ?? ''}${pc.cyan(from)} → ${pc.gray(to)} (${totalChanges} change${
						totalChanges === 1 ? '' : 's'
					})\n${prefix?.() ?? ''}\n`;
				},
			});

			if (formattedDiff.type === 'unchanged') continue;
			process.stdout.write(`${VERTICAL_LINE}\n`);
			process.stdout.write(formattedDiff.diff);

			const confirmResult = await select({
				message: 'Would you like to apply these changes?',
				options: [
					{ label: 'Yes', value: 'yes' },
					{ label: 'No', value: 'no' },
				],
				initialValue: 'yes',
			});

			if (isCancel(confirmResult)) {
				cancel('Canceled!');
				process.exit(0);
			}

			if (confirmResult === 'no') continue;

			const writeResult = writeFileSync(file.filePath, file.content);
			if (writeResult.isErr()) return err(writeResult.error);
			updatedFiles.push(path.relative(options.cwd, file.filePath));
		}
	}
	return ok(updatedFiles);
}

/**
 * Normalizes the item type for the path. We strip the `registry:` prefix if it exists.
 * @param type
 * @returns
 */
export function normalizeItemTypeForPath(type: RegistryItemType) {
	if (type.startsWith('registry:')) return type.slice('registry:'.length);
	return type;
}
