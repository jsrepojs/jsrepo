import fs from 'node:fs';
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
import type { RemoteDependency } from '@/utils/build';
import type { Config, RegistryItemType } from '@/utils/config';
import { arePathsEqual, getPathsMatcher, resolvePath, resolvePaths } from '@/utils/config/utils';
import { formatDiff } from '@/utils/diff';
import type { PathsMatcher } from '@/utils/tsconfig';
import { safeParseFromJSON } from '@/utils/zod';
import {
	InvalidDependencyError,
	type InvalidJSONError,
	InvalidRegistryError,
	type ManifestFetchError,
	MultipleRegistriesError,
	NoPathProvidedError,
	ProviderFetchError,
	RegistryFileFetchError,
	RegistryItemFetchError,
	RegistryItemNotFoundError,
	RegistryNotProvidedError,
	type ZodError,
} from './errors';
import { parsePackageName } from './parse-package-name';
import { VERTICAL_LINE } from './prompts';
import { TokenManager } from './token-manager';

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
	{ cwd, providers }: { cwd: string; providers: ProviderFactory[] }
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
		description?: string;
		add?: 'on-init' | 'when-needed' | 'when-added';
		type: RegistryItemType;
		registryDependencies?: string[];
		dependencies?: (RemoteDependency | string)[];
		files: Array<RepositoryOutputFile | DistributedOutputManifestFile>;
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
	description?: string;
	add?: 'on-init' | 'when-needed' | 'when-added';
	type: RegistryItemType;
	dependencies?: (RemoteDependency | string)[];
	registry: ResolvedRegistry;
	files: Array<RepositoryOutputFile | DistributedOutputManifestFile>;
};

export type ItemRepository = {
	name: string;
	type: RegistryItemType;
	add?: 'on-init' | 'when-needed' | 'when-added';
	description?: string;
	dependencies?: (RemoteDependency | string)[];
	devDependencies?: (RemoteDependency | string)[];
	registry: ResolvedRegistry;
	files: Array<RepositoryOutputFile & { content: string }>;
	envVars?: Record<string, string>;
};

export type ItemDistributed = DistributedOutputItem & { registry: ResolvedRegistry };

/**
 * Recursively resolves the tree of wanted items and their dependencies.
 *
 * @param wantedItems - The wanted items to resolve.
 * @param options
 * @returns
 */
export function resolveTree(
	wantedItems: ResolvedWantedItem[],
	{ resolvedItems }: { resolvedItems: Map<string, ResolvedItem> }
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

		const resolvedRegistryDependencies = resolveTree(needsResolving, { resolvedItems });
		if (resolvedRegistryDependencies.isErr()) return err(resolvedRegistryDependencies.error);
		for (const resolvedItem of resolvedRegistryDependencies.value) {
			resolvedItems.set(resolvedItem.name, resolvedItem);
		}

		resolvedItems.set(wantedItem.item.name, {
			name: wantedItem.item.name,
			type: wantedItem.item.type,
			add: wantedItem.item.add,
			dependencies: wantedItem.item.dependencies,
			registry: wantedItem.registry,
			files: wantedItem.item.files,
		});
	}
	return ok(Array.from(resolvedItems.values()));
}

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
				new RegistryFileFetchError(error.message, {
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
			const result = await fetchFile(file.path, item);
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
		registry: item.registry,
		files: filesResult,
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

/** Tries to get the path for an item. If the path is not set, it will prompt the user for a path. */
export async function getBlockLocation(
	block: { name: string; type: RegistryItemType },
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
	const defaultPath = paths['*'];
	const path = paths[block.name] ?? paths[block.type];
	if (!path) {
		if (defaultPath) {
			return ok({
				path: defaultPath,
				// already resolved
				resolvedPath: defaultPath,
			});
		}

		// we just error in non-interactive mode
		if (nonInteractive)
			return err(new NoPathProvidedError({ item: block.name, type: block.type }));

		const blocksPath = await text({
			message: `Where would you like to add ${pc.cyan(block.type)}?`,
			placeholder: `./src/${block.type}`,
			initialValue: `./src/${block.type}`,
			defaultValue: `./src/${block.type}`,
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
		languages,
		options,
		config,
		filePath,
		itemPaths,
	}: {
		item: FetchedItem;
		languages: Language[];
		options: { cwd: string };
		config: Config | undefined;
		filePath: string;
		itemPaths: Record<string, { path: string; alias?: string }>;
	}
) {
	const lang = languages.find((lang) => lang.canResolveDependencies(file.path));
	const transformations = await lang?.transformImports(file._imports_, {
		cwd: options.cwd,
		targetPath: filePath,
		getItemPath: (item) => {
			for (const key of Object.keys(itemPaths)) {
				// this will only ever match one item since items cannot have duplicate names
				if (key.endsWith(`/${item}`)) {
					return itemPaths[key]!;
				}
			}
			// we should never get here
			throw new Error(`Item path not found for ${item}`);
		},
	});
	for (const transformation of transformations ?? []) {
		file.content = file.content.replace(transformation.pattern, transformation.replacement);
	}
	for (const transform of config?.transforms ?? []) {
		const result = await transform.transform(file.content, {
			cwd: options.cwd,
			fileName: filePath,
			registryUrl: item.registry.url,
			item: item,
		});
		file.content = result.code ?? file.content;
	}

	return file.content;
}

export function getTargetPath(
	file: { path: string; relativePath?: string; target?: string },
	{
		itemPath,
		options,
	}: {
		itemPath: { path: string };
		options: { cwd: string };
	}
) {
	let filePath: string;
	if (file.target) {
		filePath = path.join(options.cwd, file.target);
	} else if ('relativePath' in file && typeof file.relativePath === 'string') {
		filePath = path.join(options.cwd, itemPath.path, file.relativePath);
	} else {
		filePath = path.join(options.cwd, itemPath.path, file.path);
	}
	return filePath;
}

export async function resolveAndFetchAllItems(
	wantedItems: ResolvedWantedItem[]
): Promise<
	Result<
		Array<ItemRepository | ItemDistributed>,
		| RegistryItemNotFoundError
		| RegistryItemFetchError
		| RegistryFileFetchError
		| InvalidJSONError
	>
> {
	const resolvedResult = resolveTree(wantedItems, { resolvedItems: new Map() });
	if (resolvedResult.isErr()) return err(resolvedResult.error);
	const resolvedItems = resolvedResult.value;

	const itemsResult = await fetchAllResolvedItems(resolvedItems);
	if (itemsResult.isErr()) return err(itemsResult.error);
	const items = itemsResult.value;

	return ok(items);
}

export async function getPathsForItems({
	items,
	config,
	options,
	continueOnNoPath = false,
}: {
	items: { name: string; type: RegistryItemType }[];
	config: Config | undefined;
	options: { cwd: string; yes: boolean };
	continueOnNoPath?: boolean;
}): Promise<
	Result<
		{
			itemPaths: Record<string, { path: string; alias?: string }>;
			resolvedPaths: Config['paths'];
		},
		NoPathProvidedError
	>
> {
	const pathsMatcher = getPathsMatcher({ cwd: options.cwd });

	const resolvedPaths = resolvePaths(config?.paths ?? {}, {
		cwd: options.cwd,
		matcher: pathsMatcher,
	});
	// get any paths that are not already set
	for (const item of items) {
		// the item name can be used to override the target
		const itemPath = resolvedPaths[`${item.type}/${item.name}`] ?? resolvedPaths[item.type];
		if (itemPath !== undefined) continue;
		const result = await getBlockLocation(item, {
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
		resolvedPaths[item.type] = resolvedPath;
		if (config) {
			config.paths[item.type] = originalPath;
		}
	}

	const itemPaths = getItemPaths(items, resolvedPaths, { config });

	return ok({ itemPaths, resolvedPaths });
}

export type UpdatedFile = {
	itemName: string;
	registryUrl: string;
	filePath: string;
	content: string;
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
	resolvedPaths,
	configResult,
	options,
}: {
	configResult: { path: string; config: Config } | null;
	options: {
		cwd: string;
		yes: boolean;
		withExamples: boolean;
		withDocs: boolean;
		withTests: boolean;
	};
	itemPaths: Record<string, { path: string; alias?: string }>;
	resolvedPaths: Config['paths'];
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
			updatedPaths: Config['paths'] | undefined;
		},
		InvalidDependencyError
	>
> {
	const neededFiles: UpdatedFile[] = [];
	const neededDependencies = new Set<RemoteDependency>();
	const neededDevDependencies = new Set<RemoteDependency>();
	let neededEnvVars: Record<string, string> | undefined;

	for (const item of items) {
		const itemPath = itemPaths[`${item.type}/${item.name}`]!;
		for (const file of item.files) {
			if (file.type === 'registry:example' && !options.withExamples) continue;
			if (file.type === 'registry:doc' && !options.withDocs) continue;
			if (file.type === 'registry:test' && !options.withTests) continue;

			const filePath = getTargetPath(file, { itemPath, options });
			file.content = await transformRemoteContent(file, {
				item,
				languages: configResult?.config.languages ?? DEFAULT_LANGS,
				options,
				config: configResult?.config,
				filePath,
				itemPaths,
			});

			// check if the file needs to be updated
			if (fs.existsSync(filePath)) {
				const originalContents = fs.readFileSync(filePath, 'utf-8');

				if (originalContents === file.content) {
					continue;
				}

				neededFiles.push({
					type: 'update',
					oldContent: originalContents,
					filePath,
					content: file.content,
					itemName: item.name,
					registryUrl: item.registry.url,
				});
			} else {
				neededFiles.push({
					type: 'create',
					filePath,
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
				neededDependencies.add({
					ecosystem: 'js',
					name: parsed.name,
					version: parsed.version,
				});
			} else {
				neededDependencies.add(remoteDependency);
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
				neededDevDependencies.add({
					ecosystem: 'js',
					name: parsed.name,
					version: parsed.version,
				});
			} else {
				neededDevDependencies.add(remoteDevDependency);
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

	// we spread here so that aliases are maintained
	let updatedPaths: Config['paths'] | undefined = {
		...resolvedPaths,
		...configResult?.config.paths,
	};
	if (!configResult || arePathsEqual(configResult.config.paths, updatedPaths)) {
		// if there are no changes or no config is provided we don't need to update the paths
		updatedPaths = undefined;
	}

	return ok({
		neededDependencies: {
			dependencies: Array.from(neededDependencies),
			devDependencies: Array.from(neededDevDependencies),
		},
		neededEnvVars,
		neededFiles,
		updatedPaths,
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
}): Promise<string[]> {
	const updatedFiles: string[] = [];
	for (const file of files) {
		if (file.type === 'create' || options.overwrite) {
			fs.mkdirSync(path.dirname(file.filePath), { recursive: true });
			fs.writeFileSync(file.filePath, file.content);
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

			fs.writeFileSync(file.filePath, file.content);
			updatedFiles.push(path.relative(options.cwd, file.filePath));
		}
	}
	return updatedFiles;
}

export function getItemPaths(
	items: { name: string; type: RegistryItemType }[],
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
	return items.reduce(
		(acc, item) => {
			const path = resolvedPaths[`${item.type}/${item.name}`] ?? resolvedPaths[item.type]!;
			// we know that if the resolved path is not the same that the user is using an alias
			const alias =
				(config?.paths[`${item.type}/${item.name}`] &&
				config?.paths[`${item.type}/${item.name}`] !==
					resolvedPaths[`${item.type}/${item.name}`]
					? config.paths[`${item.type}/${item.name}`]
					: undefined) ??
				(config?.paths[item.type] && config?.paths[item.type] !== resolvedPaths[item.type]
					? config.paths[item.type]
					: undefined);
			acc[`${item.type}/${item.name}`] = {
				path,
				alias,
			};
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
}
