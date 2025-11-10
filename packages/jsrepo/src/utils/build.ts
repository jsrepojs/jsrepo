import fs from 'node:fs';
import { log } from '@clack/prompts';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import type {
	Config,
	RegistryConfig,
	RegistryFileType,
	RegistryItem,
	RegistryItemAdd,
	RegistryItemType,
	RegistryMeta,
	RegistryPlugin,
} from '@/utils/config';
import type { LooseAutocomplete } from '@/utils/types';
import {
	type BuildError,
	DuplicateFileReferenceError,
	DuplicateItemNameError,
	FileNotFoundError,
	FileNotResolvedError,
	IllegalBlockNameError,
	ImportedFileNotResolvedError,
	InvalidDependencyError,
	InvalidRegistryDependencyError,
	NoFilesError,
	NoListedItemsError,
	SelfReferenceError,
} from './errors';
import { parsePackageName } from './parse-package-name';

export const MANIFEST_FILE = 'registry.json';

export type BuildResult = RegistryMeta & {
	plugins?: {
		languages?: RegistryPlugin[];
		providers?: RegistryPlugin[];
		transforms?: RegistryPlugin[];
	};
	items: ResolvedItem[];
	defaultPaths?: Record<string, string>;
};

export type Ecosystem = LooseAutocomplete<'js'>;

export type ResolvedItem = {
	name: string;
	title?: string;
	type: RegistryItemType;
	description?: string;
	files: RegistryFile[];
	basePath: string;
	/** Dependencies to other items in the registry */
	registryDependencies?: string[];
	/** Dependencies to code located in a remote repository to be installed later with a package manager. */
	dependencies?: RemoteDependency[];
	devDependencies?: RemoteDependency[];
	add: RegistryItemAdd;
	envVars?: Record<string, string>;
};

export type RegistryFile = {
	path: string;
	content: string;
	type?: RegistryFileType;
	/** Templates for resolving imports when adding items to users projects. This way users can add their items anywhere and things will just work. */
	_imports_: UnresolvedImport[];
	target?: string;
};

/** All the information that a client would need about the registry to correct imports in a users project. */
export type UnresolvedImport = {
	/** The literal import string to be transformed on the client */
	import: string;
	item: string;
	/** Additional properties to help resolve the import on the client */
	meta: Record<string, unknown>;
};

export type RemoteDependency = {
	/** This helps us determine how to install the dependency later */
	ecosystem: Ecosystem;
	name: string;
	version?: string;
};

export type LocalDependency = {
	/** The file name of the dependency. */
	fileName: string;
	/** The import string used to reference the dependency in the file. */
	import: string;
	/** A function that will resolve a template that can be used to transform the import on the client */
	createTemplate: (
		resolvedDependency: ResolvedFile
	) => Promise<Record<string, unknown>> | Record<string, unknown>;
};

export type Dependency = RemoteDependency | LocalDependency;

export function isLocalDependency(dependency: Dependency): dependency is LocalDependency {
	return 'fileName' in dependency;
}

export function isRemoteDependency(dependency: Dependency): dependency is RemoteDependency {
	return 'ecosystem' in dependency;
}

type ParentItem = { name: string; type: RegistryItemType; basePath: string };

export type UnresolvedFile = {
	parent: ParentItem;
	path: string;
	type?: RegistryFileType;
	dependencyResolution: 'auto' | 'manual';
	target?: string;
};

export type ResolvedFile = {
	parent: ParentItem;
	path: string;
	type?: RegistryFileType;
	dependencyResolution: 'auto' | 'manual';
	localDependencies: LocalDependency[];
	dependencies: RemoteDependency[];
	devDependencies: RemoteDependency[];
	content: string;
	target?: string;
};

/**
 * Validates the registry config
 * @param registry
 */
export async function validateRegistryConfig(
	registry: RegistryConfig
): Promise<Result<void, BuildError>> {
	const noListedItems = !registry.items.some((item) => !item.add || item.add === 'when-added');
	if (noListedItems) return err(new NoListedItemsError({ registryName: registry.name }));

	const items = new Set<string>();
	for (const item of registry.items) {
		// cannot have duplicate item names
		if (items.has(item.name))
			return err(
				new DuplicateItemNameError({ name: item.name, registryName: registry.name })
			);

		items.add(item.name);

		// cannot reference itself
		if (item.registryDependencies?.includes(item.name)) {
			return err(new SelfReferenceError({ name: item.name, registryName: registry.name }));
		}

		if (item.files.length === 0)
			return err(new NoFilesError({ name: item.name, registryName: registry.name }));

		if (item.name === 'jsrepo' || item.name === 'registry')
			return err(new IllegalBlockNameError({ name: item.name, registryName: registry.name }));

		// TODO: validate that all registry files belong to the same folder
		// here we need to pick the file that is closest to the root folder i.e. the home directory
		// that folders path serves as the base path for the registry item
		// if other items are not contained in that base path then we should error
	}

	// check to make sure that any registry dependencies are valid
	for (const item of registry.items) {
		for (const dependency of item.registryDependencies ?? []) {
			if (!items.has(dependency)) {
				return err(
					new InvalidRegistryDependencyError({
						dependency,
						item: item.name,
						registryName: registry.name,
					})
				);
			}
		}
	}

	return ok();
}

export async function buildRegistry(
	registry: RegistryConfig,
	{ options, config }: { options: { cwd: string }; config: Config }
): Promise<Result<BuildResult, BuildError>> {
	const result = await validateRegistryConfig(registry);
	if (result.isErr()) return err(result.error);

	// start by resolving all the files so we know where stuff is
	const files = registry.items.flatMap((item) =>
		item.files.map((file) => {
			const basePath = getItemBasePath(item);
			return {
				...file,
				dependencyResolution:
					file.dependencyResolution ?? item.dependencyResolution ?? 'auto',
				parent: {
					name: item.name,
					type: item.type,
					basePath: basePath ?? '',
				},
			} satisfies UnresolvedFile;
		})
	);
	const resolvedFilesResult = await resolveFiles(files, {
		cwd: options.cwd,
		config,
		registry,
	});
	if (resolvedFilesResult.isErr()) return err(resolvedFilesResult.error);
	const resolvedFiles = resolvedFilesResult.value;

	const resolvedItemsResult = await resolveRegistryItems(registry.items, {
		cwd: options.cwd,
		resolvedFiles,
		registryName: registry.name,
	});
	if (resolvedItemsResult.isErr()) return err(resolvedItemsResult.error);
	const resolvedItems = resolvedItemsResult.value;

	return ok({
		...registry,
		items: Array.from(resolvedItems.values()),
		defaultPaths: registry.defaultPaths as Record<string, string> | undefined,
	});
}

export async function resolveFiles(
	files: UnresolvedFile[],
	{
		cwd,
		resolvedFiles = new Map(),
		config,
		registry,
	}: {
		cwd: string;
		config: Config;
		registry: RegistryConfig;
		resolvedFiles?: Map<string, ResolvedFile>;
	}
): Promise<Result<Map<string, ResolvedFile>, BuildError>> {
	for (const file of files) {
		const normalizedPath = path.normalize(file.path);
		const preResolvedFile = resolvedFiles.get(normalizedPath);
		if (preResolvedFile) {
			return err(
				new DuplicateFileReferenceError({
					path: file.path,
					parent: preResolvedFile.parent,
					duplicateParent: file.parent,
					registryName: registry.name,
				})
			);
		}

		const filePath = path.join(cwd, file.path);
		if (!fs.existsSync(filePath)) {
			return err(
				new FileNotFoundError({
					path: filePath,
					parent: file.parent,
					registryName: registry.name,
				})
			);
		}

		if (!fs.statSync(filePath).isDirectory()) {
			const contents = fs.readFileSync(path.join(cwd, file.path), 'utf-8');
			let dependencies: RemoteDependency[] = [];
			let devDependencies: RemoteDependency[] = [];
			let localDependencies: LocalDependency[] = [];
			if (file.dependencyResolution === 'auto') {
				const language = config.languages.find((language) =>
					language.canResolveDependencies(file.path)
				);
				if (language) {
					const {
						localDependencies: localDeps,
						dependencies: deps,
						devDependencies: devDeps,
					} = await language.resolveDependencies(contents, {
						cwd,
						fileName: file.path,
						excludeDeps: registry.excludeDeps ?? [],
						warn: log.warn,
					});
					localDependencies = localDeps;
					dependencies = deps;
					devDependencies = devDeps;
				} else {
					log.warn(`Couldn't find a language to resolve dependencies for ${file.path}.`);
				}
			}

			resolvedFiles.set(normalizedPath, {
				...file,
				dependencies,
				devDependencies,
				localDependencies,
				content: contents,
			});
		} else {
			const files = fs.readdirSync(filePath);
			const unresolvedFiles: UnresolvedFile[] = files.map((f) => ({
				parent: file.parent,
				path: path.join(file.path, f),
				type: file.type,
				dependencyResolution: file.dependencyResolution,
				target: file.target,
			}));
			const result = await resolveFiles(unresolvedFiles, {
				cwd,
				config,
				registry,
				resolvedFiles,
			});
			if (result.isErr()) return result;
			resolvedFiles = result.value;
		}
	}
	return ok(resolvedFiles);
}

export async function resolveRegistryItems(
	items: RegistryItem[],
	{
		cwd,
		resolvedItems = new Map(),
		resolvedFiles,
		registryName,
	}: {
		cwd: string;
		resolvedItems?: Map<string, ResolvedItem>;
		resolvedFiles: Map<string, ResolvedFile>;
		registryName: string;
	}
): Promise<Result<Map<string, ResolvedItem>, BuildError>> {
	for (const item of items) {
		const resolvedItem = await resolveRegistryItem(item, {
			cwd,
			resolvedItems,
			resolvedFiles,
			registryName,
		});
		if (resolvedItem.isErr()) return err(resolvedItem.error);
		resolvedItems.set(item.name, resolvedItem.value);
	}
	return ok(resolvedItems);
}

export async function resolveRegistryItem(
	item: RegistryItem,
	{
		cwd,
		resolvedItems,
		resolvedFiles,
		registryName,
	}: {
		cwd: string;
		resolvedItems: Map<string, ResolvedItem>;
		resolvedFiles: Map<string, ResolvedFile>;
		registryName: string;
	}
): Promise<Result<ResolvedItem, BuildError>> {
	const preResolvedItem = resolvedItems.get(item.name);
	if (preResolvedItem) return ok(preResolvedItem);

	const files: RegistryFile[] = [];
	const registryDependencies = new Set<string>(item.registryDependencies ?? []);
	const dependencies = new Map<`${Ecosystem}:${string}@${string}`, RemoteDependency>();
	for (const dependency of item.dependencies ?? []) {
		if (typeof dependency === 'string') {
			const parsed = parsePackageName(dependency);
			if (parsed.isErr())
				return err(
					new InvalidDependencyError({ dependency, registryName, itemName: item.name })
				);
		} else {
			dependencies.set(
				`${dependency.ecosystem}:${dependency.name}@${dependency.version}`,
				dependency
			);
		}
	}
	const devDependencies = new Map<`${Ecosystem}:${string}@${string}`, RemoteDependency>();
	for (const dependency of item.devDependencies ?? []) {
		if (typeof dependency === 'string') {
			const parsed = parsePackageName(dependency);
			if (parsed.isErr())
				return err(
					new InvalidDependencyError({ dependency, registryName, itemName: item.name })
				);
		} else {
			devDependencies.set(
				`${dependency.ecosystem}:${dependency.name}@${dependency.version}`,
				dependency
			);
		}
	}

	for (const file of item.files) {
		const filePath = path.join(cwd, file.path);
		// the file must have been found otherwise we would have failed earlier
		const isDirectory = fs.statSync(filePath).isDirectory();
		if (isDirectory) {
			for (const f of fs.readdirSync(filePath)) {
				const resolvedFile = resolvedFiles.get(path.normalize(path.join(file.path, f)));
				if (!resolvedFile)
					return err(
						new FileNotResolvedError({
							file: path.join(file.path, f),
							item: item.name,
							registryName: registryName,
						})
					);
				const resolvedResult = await resolveFileDependencies(resolvedFile);
				if (resolvedResult.isErr()) return err(resolvedResult.error);
			}
		} else {
			const resolvedFile = resolvedFiles.get(path.normalize(file.path));
			if (!resolvedFile)
				return err(
					new FileNotResolvedError({
						file: file.path,
						item: item.name,
						registryName: registryName,
					})
				);
			const resolvedResult = await resolveFileDependencies(resolvedFile);
			if (resolvedResult.isErr()) return err(resolvedResult.error);
		}

		async function resolveFileDependencies(
			resolvedFile: ResolvedFile
		): Promise<Result<void, BuildError>> {
			const _imports_: UnresolvedImport[] = [];
			if (resolvedFile.dependencyResolution === 'auto') {
				for (const dependency of resolvedFile.localDependencies) {
					const localDependency = resolvedFiles.get(
						path.normalize(path.relative(cwd, dependency.fileName))
					);
					if (localDependency) {
						// never self reference
						if (localDependency.parent.name !== item.name) {
							registryDependencies.add(localDependency.parent.name);
						}

						_imports_.push({
							import: dependency.import,
							item: localDependency.parent.name,
							meta: await dependency.createTemplate(localDependency),
						});
					} else {
						// only error if in strict mode
						if (item.strict === false) continue;
						return err(
							new ImportedFileNotResolvedError({
								referencedFile: dependency.fileName,
								fileName: resolvedFile.path,
								item: item.name,
								registryName: registryName,
							})
						);
					}
				}

				for (const dependency of resolvedFile.dependencies) {
					dependencies.set(
						`${dependency.ecosystem}:${dependency.name}@${dependency.version}`,
						dependency
					);
				}

				for (const dependency of resolvedFile.devDependencies) {
					devDependencies.set(
						`${dependency.ecosystem}:${dependency.name}@${dependency.version}`,
						dependency
					);
				}
			}

			files.push({
				target: resolvedFile.target,
				path: resolvedFile.path,
				content: resolvedFile.content,
				type: resolvedFile.type,
				_imports_,
			});

			return ok();
		}
	}

	return ok({
		name: item.name,
		title: item.title,
		type: item.type,
		description: item.description,
		basePath: getItemBasePath(item) ?? '',
		files,
		registryDependencies: Array.from(registryDependencies),
		dependencies: Array.from(dependencies.values()),
		add: item.add ?? 'when-added',
		envVars: item.envVars,
	});
}

/**
 * Uses the registry item files to determine the base path of the item closest to the registry root
 * @param registryItem
 * @param param1
 * @returns
 */
export function getItemBasePath(registryItem: RegistryItem): string | undefined {
	// TODO: make this error or something if the base path is not found
	if (registryItem.files.length === 0) return undefined;

	let minDistance: { dirname: string; distance: number } | null = null;

	for (const file of registryItem.files) {
		const dirname = path.normalize(path.dirname(file.path));
		const distance = dirname.split('/').length;

		if (minDistance === null || distance < minDistance.distance) {
			minDistance = { dirname, distance };
		}
	}

	return minDistance?.dirname;
}
