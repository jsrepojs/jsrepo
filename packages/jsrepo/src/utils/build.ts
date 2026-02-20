import { isDynamicPattern } from 'fast-glob';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import { z } from 'zod';
import type {
	Config,
	RegistryConfig,
	RegistryFileRoles,
	RegistryItem,
	RegistryItemAdd,
	RegistryItemFile,
	RegistryItemFolderFile,
	RegistryItemType,
	RegistryMeta,
	RegistryPlugin,
} from '@/utils/config';
import { isOptionalRole } from '@/utils/roles';
import type { AbsolutePath, ItemRelativePath, LooseAutocomplete } from '@/utils/types';
import {
	createWarningHandler,
	GlobPatternNoMatchWarning,
	LanguageNotFoundWarning,
	type WarningHandler,
} from '@/utils/warnings';
import {
	BuildError,
	DuplicateFileReferenceError,
	DuplicateItemNameError,
	FileNotFoundError,
	IllegalItemNameError,
	ImportedFileNotResolvedError,
	InvalidDependencyError,
	InvalidRegistryDependencyError,
	NoFilesError,
	NoListedItemsError,
	SelfReferenceError,
} from './errors';
import { existsSync, readdirSync, readFileSync, statSync } from './fs';
import { getGlobBaseDirectory, glob } from './glob';
import { parsePackageName } from './parse-package-name';
import { joinAbsolute, joinRelative, type NormalizedAbsolutePath, normalizeAbsolute } from './path';
import { endsWithOneOf } from './strings';

/**
 * We won't warn about these file types when resolving dependencies.
 */
const DO_NOT_RESOLVE_EXTENSIONS = [
	// Images
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.svg',
	'.webp',
	'.ico',
	'.bmp',
	'.tiff',
	// 3D models
	'.glb',
	'.gltf',
	'.obj',
	'.fbx',
	'.dae',
	// Fonts
	'.woff',
	'.woff2',
	'.ttf',
	'.eot',
	'.otf',
	// Media
	'.mp4',
	'.webm',
	'.mp3',
	'.wav',
	'.ogg',
	'.avi',
	// Archives
	'.zip',
	'.tar',
	'.gz',
	// Other binary
	'.pdf',
	'.exe',
	'.dll',
	'.so',
	'.dylib',
] as const;

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
	title: string | undefined;
	type: RegistryItemType;
	description: string | undefined;
	files: RegistryFile[];
	/** Dependencies to other items in the registry */
	registryDependencies: string[] | undefined;
	/** Dependencies to code located in a remote repository to be installed later with a package manager. */
	dependencies: RemoteDependency[] | undefined;
	devDependencies: RemoteDependency[] | undefined;
	add: RegistryItemAdd;
	envVars: Record<string, string> | undefined;
	categories: string[] | undefined;
	meta: Record<string, string> | undefined;
};

export type RegistryFile = {
	/** The absolute path to the file. This can be immediately used to read the file. */
	absolutePath: AbsolutePath;
	/** Path of the file relative to the parent item. */
	path: ItemRelativePath;
	content: string;
	type: RegistryItemType;
	role: RegistryFileRoles;
	/** Templates for resolving imports when adding items to users projects. This way users can add their items anywhere and things will just work. */
	_imports_: UnresolvedImport[];
	target?: string;
	registryDependencies: string[] | undefined;
	dependencies: RemoteDependency[] | undefined;
	devDependencies: RemoteDependency[] | undefined;
};

export const UnresolvedImportSchema = z.object({
	import: z.string(),
	item: z.string(),
	file: z.object({
		type: z.string(),
		path: z.string().transform((v) => v as ItemRelativePath),
	}),
	meta: z.record(z.string(), z.unknown()),
});

/** All the information that a client would need about the registry to correct imports in a users project. */
export type UnresolvedImport = {
	/** The literal import string to be transformed on the client */
	import: string;
	item: string;
	file: { type: RegistryItemType; path: ItemRelativePath };
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
	fileName: AbsolutePath;
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

type ParentItem = { name: string; type: RegistryItemType; registryName: string };

/**
 * A file that has not been resolved yet. This should not be a folder!
 */
export type UnresolvedFile = {
	/**
	 * The absolute path to the file. This can be immediately used to read the file.
	 */
	absolutePath: AbsolutePath;
	/**
	 * Path of the file relative to the parent item.
	 */
	path: ItemRelativePath;
	parent: ParentItem;
	type: RegistryItemType | undefined;
	role: RegistryFileRoles | undefined;
	dependencyResolution: 'auto' | 'manual';
	registryDependencies: string[] | undefined;
	dependencies: (string | RemoteDependency)[] | undefined;
	devDependencies: (string | RemoteDependency)[] | undefined;
	target: string | undefined;
};

export type ResolvedFile = {
	/**
	 * The absolute path to the file. This can be immediately used to read the file.
	 */
	absolutePath: AbsolutePath;
	/**
	 * Path of the file relative to the parent item.
	 */
	path: ItemRelativePath;
	parent: ParentItem;
	type: RegistryItemType;
	role: RegistryFileRoles;
	dependencyResolution: 'auto' | 'manual';
	localDependencies: LocalDependency[];
	dependencies: RemoteDependency[];
	devDependencies: RemoteDependency[];
	manualDependencies: {
		registryDependencies: string[] | undefined;
		dependencies: RemoteDependency[];
		devDependencies: RemoteDependency[];
	};
	content: string;
	target: string | undefined;
};

export type ResolvedFiles = Map<NormalizedAbsolutePath, ResolvedFile>;

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

		if (item.name === 'registry')
			return err(new IllegalItemNameError({ name: item.name, registryName: registry.name }));
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

type ExpandedRegistryItem = Omit<RegistryItem, 'files'> & {
	files: UnresolvedFile[];
};

/**
 * Resolve any glob patterns or nested files within registry items and return a list of registry items with a flattened array of files.
 *
 * @param registry
 * @param param1
 */
export async function expandRegistryItems(
	registry: RegistryConfig,
	{ cwd, warn }: { cwd: AbsolutePath; warn: WarningHandler }
): Promise<Result<ExpandedRegistryItem[], BuildError>> {
	const expandedRegistryItems: ExpandedRegistryItem[] = [];

	for (const item of registry.items) {
		const expandedFilesResult = await expandItemFiles(item.files, {
			cwd,
			item,
			registry,
			warn,
		});
		if (expandedFilesResult.isErr()) return err(expandedFilesResult.error);
		const expandedFiles = expandedFilesResult.value;
		if (expandedFiles.length === 0) {
			return err(new NoFilesError({ name: item.name, registryName: registry.name }));
		}
		expandedRegistryItems.push({
			...item,
			files: expandedFiles,
		});
	}

	return ok(expandedRegistryItems);
}

async function expandItemFiles(
	files: RegistryItemFile[],
	{
		cwd,
		item,
		registry,
		warn,
	}: { cwd: AbsolutePath; item: RegistryItem; registry: RegistryConfig; warn: WarningHandler }
): Promise<Result<UnresolvedFile[], BuildError>> {
	const unresolvedFiles: UnresolvedFile[] = [];

	for (const file of files) {
		const absolutePath = joinAbsolute(cwd, file.path);
		if (isDynamicPattern(absolutePath)) {
			if (!file.files) {
				const entriesResult = await glob(absolutePath, {
					absolute: true,
					dot: true,
					registryName: registry.name,
				});
				if (entriesResult.isErr()) return err(entriesResult.error);
				const entries = entriesResult.value;
				if (entries.length === 0) {
					warn(
						new GlobPatternNoMatchWarning({ itemName: item.name, pattern: file.path })
					);
					continue;
				}
				// This preserves subdirectory structure when glob patterns match files in subdirectories
				const globBaseDir = joinAbsolute(
					cwd,
					getGlobBaseDirectory(file.path, { cwd, dot: true })
				);
				const files = entries.map((e) => {
					const relativePath = path.relative(globBaseDir, e);
					return {
						...file,
						path: (relativePath || path.basename(e)) as ItemRelativePath,
						absolutePath: e as AbsolutePath,
					};
				});

				unresolvedFiles.push(
					...files.map((f) => ({
						absolutePath: f.absolutePath,
						path: f.path,
						type: f.type ?? item.type,
						role: f.role ?? 'file',
						target: f.target,
						dependencyResolution:
							f.dependencyResolution ?? item.dependencyResolution ?? 'auto',
						parent: {
							name: item.name,
							type: item.type,
							registryName: registry.name,
						},
						registryDependencies: f.registryDependencies,
						dependencies: f.dependencies,
						devDependencies: f.devDependencies,
					}))
				);
				continue;
			}

			const subFilesResult = await expandItemFolderFiles(file.files, {
				parent: {
					type: file.type ?? item.type,
					role: file.role ?? 'file',
					target: file.target,
					dependencyResolution: item.dependencyResolution ?? 'auto',
					parentItem: {
						name: item.name,
						type: item.type,
						registryName: registry.name,
					},
					path: file.path as ItemRelativePath,
					absolutePath: absolutePath,
				},
				cwd,
				item,
				registry,
				warn,
			});
			if (subFilesResult.isErr()) return err(subFilesResult.error);
			unresolvedFiles.push(...subFilesResult.value);
		} else {
			if (!existsSync(absolutePath)) {
				return err(
					new FileNotFoundError({
						path: absolutePath,
						parent: {
							name: item.name,
							type: item.type,
						},
						registryName: registry.name,
					})
				);
			}

			const statResult = statSync(absolutePath)._unsafeUnwrap();
			if (statResult.isFile()) {
				unresolvedFiles.push({
					absolutePath,
					path: path.basename(file.path) as ItemRelativePath,
					type: file.type ?? item.type,
					role: file.role ?? 'file',
					target: file.target,
					dependencyResolution:
						file.dependencyResolution ?? item.dependencyResolution ?? 'auto',
					parent: {
						name: item.name,
						type: item.type,
						registryName: registry.name,
					},
					registryDependencies: file.registryDependencies,
					dependencies: file.dependencies,
					devDependencies: file.devDependencies,
				});
				// only folders can have sub files
				continue;
			}

			let files: RegistryItemFolderFile[];
			if (file.files) {
				files = file.files;
			} else {
				const readdirResult = readdirSync(absolutePath);
				if (readdirResult.isErr())
					return err(
						new BuildError(
							`Error reading directory: ${pc.bold(absolutePath)} referenced by ${pc.bold(item.name)}`,
							{
								registryName: registry.name,
								suggestion: 'Please ensure the directory exists and is readable.',
							}
						)
					);
				files = readdirResult.value.map((f) => ({
					path: f,
				}));
			}

			const subFilesResult = await expandItemFolderFiles(files ?? [], {
				parent: {
					type: file.type ?? item.type,
					role: file.role ?? 'file',
					target: file.target,
					dependencyResolution: item.dependencyResolution ?? 'auto',
					parentItem: {
						name: item.name,
						type: item.type,
						registryName: registry.name,
					},
					// we use the basename of the folder
					path: path.basename(file.path) as ItemRelativePath,
					absolutePath: absolutePath,
				},
				cwd,
				item,
				registry,
				warn,
			});
			if (subFilesResult.isErr()) return err(subFilesResult.error);
			unresolvedFiles.push(...subFilesResult.value);
		}
	}

	return ok(unresolvedFiles);
}

async function expandItemFolderFiles(
	files: RegistryItemFolderFile[],
	{
		cwd,
		item,
		registry,
		parent,
		warn,
	}: {
		parent: {
			type: RegistryItemType;
			role: RegistryFileRoles;
			target: string | undefined;
			dependencyResolution: 'auto' | 'manual';
			parentItem: ParentItem;
			path: ItemRelativePath;
			absolutePath: AbsolutePath;
		};
		cwd: AbsolutePath;
		item: RegistryItem;
		registry: RegistryConfig;
		warn: WarningHandler;
	}
): Promise<Result<UnresolvedFile[], BuildError>> {
	const unresolvedFiles: UnresolvedFile[] = [];
	for (const f of files) {
		const absolutePath = joinAbsolute(parent.absolutePath, f.path);
		if (isDynamicPattern(absolutePath)) {
			if (!f.files) {
				const entriesResult = await glob(absolutePath, {
					absolute: true,
					dot: true,
					registryName: registry.name,
				});
				if (entriesResult.isErr()) return err(entriesResult.error);
				const entries = entriesResult.value;
				if (entries.length === 0) {
					warn(new GlobPatternNoMatchWarning({ itemName: item.name, pattern: f.path }));
					continue;
				}
				// This preserves subdirectory structure when glob patterns match files in subdirectories
				const globBaseDir = joinAbsolute(
					parent.absolutePath,
					getGlobBaseDirectory(f.path, { cwd: parent.absolutePath, dot: true })
				);
				const files = entries.map((e) => {
					const relativePath = path.relative(globBaseDir, e);
					return {
						...f,
						path: (relativePath || path.basename(e)) as ItemRelativePath,
						absolutePath: e as AbsolutePath,
					};
				});
				unresolvedFiles.push(
					...files.map((f) => ({
						absolutePath: f.absolutePath,
						path: path.join(parent.path, f.path) as ItemRelativePath,
						type: parent.type,
						role: f.role ?? parent.role,
						target: parent.target ? path.join(parent.target, f.path) : undefined,
						dependencyResolution: f.dependencyResolution ?? parent.dependencyResolution,
						parent: parent.parentItem,
						registryDependencies: f.registryDependencies,
						dependencies: f.dependencies,
						devDependencies: f.devDependencies,
					}))
				);
				continue;
			}

			const subFilesResult = await expandItemFolderFiles(f.files, {
				parent: {
					parentItem: parent.parentItem,
					target: parent.target ? path.join(parent.target, f.path) : undefined,
					type: parent.type,
					role: f.role ?? parent.role,
					dependencyResolution: parent.dependencyResolution,
					path: joinRelative(parent.path, f.path),
					absolutePath: joinAbsolute(parent.absolutePath, f.path),
				},
				cwd,
				item,
				registry,
				warn,
			});
			if (subFilesResult.isErr()) return err(subFilesResult.error);
			unresolvedFiles.push(...subFilesResult.value);
		} else {
			if (!existsSync(absolutePath)) {
				return err(
					new FileNotFoundError({
						path: absolutePath,
						parent: {
							name: parent.parentItem.name,
							type: parent.parentItem.type,
						},
						registryName: parent.parentItem.registryName,
					})
				);
			}

			const isFile = statSync(absolutePath)._unsafeUnwrap().isFile();
			if (isFile) {
				unresolvedFiles.push({
					absolutePath,
					path: path.join(parent.path, f.path) as ItemRelativePath,
					type: parent.type,
					role: f.role ?? parent.role,
					target: parent.target ? path.join(parent.target, f.path) : undefined,
					dependencyResolution: f.dependencyResolution ?? parent.dependencyResolution,
					parent: parent.parentItem,
					registryDependencies: f.registryDependencies,
					dependencies: f.dependencies,
					devDependencies: f.devDependencies,
				});
				// only folders can have sub files
				continue;
			}

			let files: RegistryItemFolderFile[];
			if (f.files) {
				files = f.files;
			} else {
				const readdirResult = readdirSync(absolutePath);
				if (readdirResult.isErr())
					return err(
						new BuildError(
							`Error reading directory: ${pc.bold(absolutePath)} referenced by ${pc.bold(
								parent.parentItem.name
							)}`,
							{
								registryName: parent.parentItem.registryName,
								suggestion: 'Please ensure the directory exists and is readable.',
							}
						)
					);
				files = readdirResult.value.map((f) => ({
					path: f,
				}));
			}

			const subFilesResult = await expandItemFolderFiles(files ?? [], {
				parent: {
					parentItem: parent.parentItem,
					target: parent.target ? path.join(parent.target, f.path) : undefined,
					type: parent.type,
					role: f.role ?? parent.role,
					dependencyResolution: parent.dependencyResolution,
					path: joinRelative(parent.path, f.path),
					absolutePath: joinAbsolute(parent.absolutePath, f.path),
				},
				cwd,
				item,
				registry,
				warn,
			});
			if (subFilesResult.isErr()) return err(subFilesResult.error);
			unresolvedFiles.push(...subFilesResult.value);
		}
	}
	return ok(unresolvedFiles);
}

export async function buildRegistry(
	registry: RegistryConfig,
	{ options, config }: { options: { cwd: AbsolutePath }; config: Config }
): Promise<Result<BuildResult, BuildError>> {
	const result = await validateRegistryConfig(registry);
	if (result.isErr()) return err(result.error);

	const warn = createWarningHandler(config.build?.onwarn);

	const expandedRegistryItemsResult = await expandRegistryItems(registry, {
		cwd: options.cwd,
		warn,
	});
	if (expandedRegistryItemsResult.isErr()) return err(expandedRegistryItemsResult.error);
	const expandedRegistryItems = expandedRegistryItemsResult.value;

	const resolvedFilesResult = await resolveFiles(
		expandedRegistryItems.flatMap((item) => item.files),
		{
			cwd: options.cwd,
			config,
			registry,
			warn,
		}
	);
	if (resolvedFilesResult.isErr()) return err(resolvedFilesResult.error);
	const resolvedFiles = resolvedFilesResult.value;

	const resolvedItemsResult = await resolveRegistryItems(expandedRegistryItems, {
		cwd: options.cwd,
		config,
		resolvedFiles,
		registry,
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
		resolvedFiles = new Map<NormalizedAbsolutePath, ResolvedFile>(),
		config,
		registry,
		warn,
	}: {
		cwd: AbsolutePath;
		config: Config;
		registry: RegistryConfig | { name: string; excludeDeps?: string[] };
		resolvedFiles?: ResolvedFiles;
		warn: WarningHandler;
	}
): Promise<Result<ResolvedFiles, BuildError>> {
	for (const file of files) {
		const normalizedPath = normalizeAbsolute(file.absolutePath);
		const previouslyResolvedFile = resolvedFiles.get(normalizedPath);
		if (previouslyResolvedFile) {
			return err(
				new DuplicateFileReferenceError({
					path: file.path,
					parent: previouslyResolvedFile.parent,
					duplicateParent: file.parent,
					registryName: registry.name,
				})
			);
		}

		if (!existsSync(file.absolutePath)) {
			return err(
				new FileNotFoundError({
					path: file.absolutePath,
					parent: file.parent,
					registryName: registry.name,
				})
			);
		}

		const resolveResult = await resolveFile(file, { cwd, config, registry, warn });
		if (resolveResult.isErr()) return err(resolveResult.error);
		resolvedFiles.set(normalizedPath, resolveResult.value);
	}
	return ok(resolvedFiles);
}

async function resolveFile(
	file: UnresolvedFile,
	{
		cwd,
		config,
		registry,
		warn,
	}: {
		cwd: AbsolutePath;
		config: Config;
		registry: { name: string; excludeDeps?: string[] };
		warn: WarningHandler;
	}
): Promise<Result<ResolvedFile, BuildError>> {
	const contentResult = readFileSync(file.absolutePath);
	if (contentResult.isErr())
		return err(
			new BuildError(
				`Failed to read file ${pc.bold(file.absolutePath)} referenced by ${pc.bold(file.parent.name)}`,
				{
					registryName: registry.name,
					suggestion: 'Please ensure the file exists and is readable.',
				}
			)
		);
	const content = contentResult.value;

	const manualDependencies = toRemoteDependencies(file.dependencies ?? [], {
		registryName: registry.name,
		itemName: file.parent.name,
	});
	if (manualDependencies.isErr()) return err(manualDependencies.error);

	const manualDevDependencies = toRemoteDependencies(file.devDependencies ?? [], {
		registryName: registry.name,
		itemName: file.parent.name,
	});
	if (manualDevDependencies.isErr()) return err(manualDevDependencies.error);

	let localDependencies: LocalDependency[] = [];
	let dependencies: RemoteDependency[] = [];
	let devDependencies: RemoteDependency[] = [];
	if (file.dependencyResolution === 'auto') {
		const language = config.languages.find((language) =>
			language.canResolveDependencies(file.path)
		);
		if (language) {
			const {
				localDependencies: localDeps,
				dependencies: deps,
				devDependencies: devDeps,
			} = await language.resolveDependencies(content, {
				cwd,
				fileName: file.absolutePath,
				excludeDeps: registry.excludeDeps ?? [],
				warn,
			});
			localDependencies = localDeps;
			dependencies = deps;
			devDependencies = devDeps;
		} else {
			// only log a warning if the file is not a binary asset file
			if (!endsWithOneOf(file.path, DO_NOT_RESOLVE_EXTENSIONS)) {
				warn(new LanguageNotFoundWarning({ path: file.absolutePath }));
			}
		}
	}

	return ok({
		absolutePath: file.absolutePath,
		path: file.path,
		// inherit the type from the parent item
		type: file.type ?? file.parent.type,
		role: file.role ?? 'file',
		parent: file.parent,
		target: file.target,
		dependencyResolution: file.dependencyResolution,
		localDependencies,
		dependencies,
		devDependencies,
		manualDependencies: {
			registryDependencies: file.registryDependencies,
			dependencies: manualDependencies.value,
			devDependencies: manualDevDependencies.value,
		},
		content,
	});
}

export async function resolveRegistryItems(
	items: ExpandedRegistryItem[],
	{
		cwd,
		config,
		resolvedItems = new Map<string, ResolvedItem>(),
		resolvedFiles,
		registry,
	}: {
		cwd: AbsolutePath;
		config: Config;
		resolvedItems?: Map<string, ResolvedItem>;
		resolvedFiles: ResolvedFiles;
		registry: { name: string };
	}
): Promise<Result<Map<string, ResolvedItem>, BuildError>> {
	for (const item of items) {
		const resolvedItem = await resolveRegistryItem(item, {
			cwd,
			config,
			resolvedItems,
			resolvedFiles,
			registry,
		});
		if (resolvedItem.isErr()) return err(resolvedItem.error);
		resolvedItems.set(item.name, resolvedItem.value);
	}
	return ok(resolvedItems);
}

export type DependencyKey = `${Ecosystem}:${string}@${string}`;

function toDependencyKey(dep: RemoteDependency): DependencyKey {
	return `${dep.ecosystem}:${dep.name}@${dep.version}`;
}

async function resolveRemoteDependencies(
	deps: RemoteDependency[],
	{ config, registryName, itemName }: { config: Config; registryName: string; itemName: string }
): Promise<Result<RemoteDependency[], BuildError>> {
	const resolver = config.build?.remoteDependencyResolver;
	if (!resolver) return ok(deps);

	const resolved: RemoteDependency[] = [];
	for (const dep of deps) {
		try {
			resolved.push(await resolver(dep));
		} catch {
			return err(
				new BuildError(
					`Failed to resolve remote dependency ${pc.bold(dep.name)} referenced by ${pc.bold(itemName)}.`,
					{
						registryName,
						suggestion: `Please ensure build.remoteDependencyResolver can resolve ${dep.name}${dep.version ? `@${dep.version}` : ''}.`,
					}
				)
			);
		}
	}

	return ok(resolved);
}

export async function resolveRegistryItem(
	item: ExpandedRegistryItem,
	{
		cwd,
		config,
		resolvedItems,
		resolvedFiles,
		registry,
	}: {
		cwd: AbsolutePath;
		config: Config;
		resolvedItems: Map<string, ResolvedItem>;
		resolvedFiles: ResolvedFiles;
		registry: { name: string };
	}
): Promise<Result<ResolvedItem, BuildError>> {
	const preResolvedItem = resolvedItems.get(item.name);
	if (preResolvedItem) return ok(preResolvedItem);

	const files: RegistryFile[] = [];
	const registryDependencies = new Set<string>(item.registryDependencies ?? []);

	const dependenciesResult = toRemoteDependencies(item.dependencies ?? [], {
		registryName: registry.name,
		itemName: item.name,
	});
	if (dependenciesResult.isErr()) return err(dependenciesResult.error);
	const resolvedDependenciesResult = await resolveRemoteDependencies(dependenciesResult.value, {
		config,
		registryName: registry.name,
		itemName: item.name,
	});
	if (resolvedDependenciesResult.isErr()) return err(resolvedDependenciesResult.error);
	const dependencies = new Map<DependencyKey, RemoteDependency>(
		resolvedDependenciesResult.value.map((dep) => [toDependencyKey(dep), dep])
	);

	const devDependenciesResult = toRemoteDependencies(item.devDependencies ?? [], {
		registryName: registry.name,
		itemName: item.name,
	});
	if (devDependenciesResult.isErr()) return err(devDependenciesResult.error);
	const resolvedDevDependenciesResult = await resolveRemoteDependencies(
		devDependenciesResult.value,
		{
			config,
			registryName: registry.name,
			itemName: item.name,
		}
	);
	if (resolvedDevDependenciesResult.isErr()) return err(resolvedDevDependenciesResult.error);
	const devDependencies = new Map<DependencyKey, RemoteDependency>(
		resolvedDevDependenciesResult.value.map((dep) => [toDependencyKey(dep), dep])
	);

	const itemFiles = Array.from(resolvedFiles.values()).filter(
		(file) => file.parent.name === item.name
	);

	for (const resolvedFile of itemFiles) {
		const resolvedResult = await resolveFileDependencies(resolvedFile, {
			item,
			config,
			resolvedFiles,
			cwd,
		});
		if (resolvedResult.isErr()) return err(resolvedResult.error);
		const {
			file,
			dependencies: deps,
			devDependencies: devDeps,
			registryDependencies: regDeps,
		} = resolvedResult.value;

		files.push(file);

		for (const dep of deps) {
			dependencies.set(toDependencyKey(dep), dep);
		}
		for (const dep of devDeps) {
			devDependencies.set(toDependencyKey(dep), dep);
		}
		for (const dep of regDeps) {
			registryDependencies.add(dep);
		}
	}

	return ok({
		name: item.name,
		title: item.title,
		type: item.type,
		description: item.description,
		files,
		registryDependencies: Array.from(registryDependencies),
		dependencies: Array.from(dependencies.values()),
		devDependencies: Array.from(devDependencies.values()),
		add: item.add ?? 'when-added',
		envVars: item.envVars,
		categories: item.categories,
		meta: item.meta,
	});
}

async function resolveFileDependencies(
	resolvedFile: ResolvedFile,
	{
		resolvedFiles,
		item,
		config,
	}: {
		resolvedFiles: ResolvedFiles;
		item: ExpandedRegistryItem;
		config: Config;
		cwd: AbsolutePath;
	}
): Promise<
	Result<
		{
			file: RegistryFile;
			dependencies: RemoteDependency[];
			devDependencies: RemoteDependency[];
			registryDependencies: string[];
		},
		BuildError
	>
> {
	const optionalFileType = isOptionalRole(resolvedFile.role);

	const _imports_: UnresolvedImport[] = [];

	const dependencies = new Map<DependencyKey, RemoteDependency>();
	const devDependencies = new Map<DependencyKey, RemoteDependency>();
	const registryDependencies = new Set<string>();

	const resolvedFileDependenciesResult = await resolveRemoteDependencies(
		resolvedFile.manualDependencies.dependencies,
		{
			config,
			registryName: resolvedFile.parent.registryName,
			itemName: item.name,
		}
	);
	if (resolvedFileDependenciesResult.isErr()) return err(resolvedFileDependenciesResult.error);

	const fileDependencies = new Map<DependencyKey, RemoteDependency>(
		resolvedFileDependenciesResult.value.map((dep) => [toDependencyKey(dep), dep])
	);

	const resolvedFileDevDependenciesResult = await resolveRemoteDependencies(
		resolvedFile.manualDependencies.devDependencies,
		{
			config,
			registryName: resolvedFile.parent.registryName,
			itemName: item.name,
		}
	);
	if (resolvedFileDevDependenciesResult.isErr())
		return err(resolvedFileDevDependenciesResult.error);

	const fileDevDependencies = new Map<DependencyKey, RemoteDependency>(
		resolvedFileDevDependenciesResult.value.map((dep) => [toDependencyKey(dep), dep])
	);
	const fileRegistryDependencies = new Set<string>(
		resolvedFile.manualDependencies.registryDependencies
	);

	if (resolvedFile.dependencyResolution === 'auto') {
		const resolvedDependenciesResult = await resolveRemoteDependencies(
			resolvedFile.dependencies,
			{
				config,
				registryName: resolvedFile.parent.registryName,
				itemName: item.name,
			}
		);
		if (resolvedDependenciesResult.isErr()) return err(resolvedDependenciesResult.error);

		const resolvedDevDependenciesResult = await resolveRemoteDependencies(
			resolvedFile.devDependencies,
			{
				config,
				registryName: resolvedFile.parent.registryName,
				itemName: item.name,
			}
		);
		if (resolvedDevDependenciesResult.isErr()) return err(resolvedDevDependenciesResult.error);

		for (const dependency of resolvedFile.localDependencies) {
			const localDependency = resolvedFiles.get(normalizeAbsolute(dependency.fileName));
			if (localDependency) {
				const selfReference = localDependency.parent.name === item.name;
				// only add to registry dependencies if not a self reference
				if (!selfReference) {
					if (optionalFileType) {
						fileRegistryDependencies.add(localDependency.parent.name);
					} else {
						registryDependencies.add(localDependency.parent.name);
					}
				}

				_imports_.push({
					import: dependency.import,
					item: localDependency.parent.name,
					file: {
						type: localDependency.type,
						path: localDependency.path,
					},
					meta: await dependency.createTemplate(localDependency),
				});
			} else {
				// only error if in strict mode
				if (item.strict === false) continue;
				return err(
					new ImportedFileNotResolvedError({
						referencedFile: dependency.fileName,
						fileName: resolvedFile.absolutePath,
						item: item.name,
						registryName: resolvedFile.parent.registryName,
					})
				);
			}
		}

		for (const dependency of resolvedDependenciesResult.value) {
			if (optionalFileType) {
				fileDependencies.set(toDependencyKey(dependency), dependency);
			} else {
				dependencies.set(toDependencyKey(dependency), dependency);
			}
		}

		for (const dependency of resolvedDevDependenciesResult.value) {
			if (optionalFileType) {
				fileDevDependencies.set(toDependencyKey(dependency), dependency);
			} else {
				devDependencies.set(toDependencyKey(dependency), dependency);
			}
		}
	}

	return ok({
		file: {
			absolutePath: resolvedFile.absolutePath,
			target: resolvedFile.target,
			path: resolvedFile.path,
			content: resolvedFile.content,
			type: resolvedFile.type,
			role: resolvedFile.role,
			_imports_,
			registryDependencies: Array.from(fileRegistryDependencies),
			dependencies: Array.from(fileDependencies.values()),
			devDependencies: Array.from(fileDevDependencies.values()),
		},
		dependencies: Array.from(dependencies.values()),
		devDependencies: Array.from(devDependencies.values()),
		registryDependencies: Array.from(registryDependencies),
	});
}

/**
 * Convert a list of string or RemoteDependency objects into an array of RemoteDependency objects.
 *
 * @param dependencies
 * @param param1
 * @returns
 */
export function toRemoteDependencies(
	dependencies: (string | RemoteDependency)[],
	{ registryName, itemName }: { registryName: string; itemName: string }
): Result<RemoteDependency[], BuildError> {
	const remoteDependencies = new Map<DependencyKey, RemoteDependency>();
	for (const dependency of dependencies) {
		let dep: RemoteDependency;
		if (typeof dependency === 'string') {
			const depResult = stringToRemoteDependency(dependency, { registryName, itemName });
			if (depResult.isErr()) return err(depResult.error);
			dep = depResult.value;
		} else {
			dep = dependency;
		}
		remoteDependencies.set(toDependencyKey(dep), dep);
	}
	return ok(Array.from(remoteDependencies.values()));
}

/**
 * Convert a string into a RemoteDependency object.
 *
 * @param dependency
 * @param param1
 * @returns
 */
export function stringToRemoteDependency(
	dependency: string,
	{ registryName, itemName }: { registryName: string; itemName: string }
): Result<RemoteDependency, BuildError> {
	const parsed = parsePackageName(dependency);
	if (parsed.isErr())
		return err(new InvalidDependencyError({ dependency, registryName, itemName }));
	return ok({
		ecosystem: 'js',
		name: parsed.value.name,
		version: parsed.value.version,
	});
}
