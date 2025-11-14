import { log } from '@clack/prompts';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import type {
	Config,
	RegistryConfig,
	RegistryFileType,
	RegistryItem,
	RegistryItemAdd,
	RegistryItemFolderFile,
	RegistryItemType,
	RegistryMeta,
	RegistryPlugin,
} from '@/utils/config';
import type { AbsolutePath, ItemRelativePath, LooseAutocomplete } from '@/utils/types';
import {
	BuildError,
	DuplicateFileReferenceError,
	DuplicateItemNameError,
	FileNotFoundError,
	IllegalBlockNameError,
	ImportedFileNotResolvedError,
	InvalidDependencyError,
	InvalidRegistryDependencyError,
	NoFilesError,
	NoListedItemsError,
	SelfReferenceError,
} from './errors';
import { existsSync, readdirSync, readFileSync, statSync } from './fs';
import { parsePackageName } from './parse-package-name';
import { joinAbsolute, joinRelative, type NormalizedAbsolutePath, normalizeAbsolute } from './path';

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
};

export type RegistryFile = {
	/** The absolute path to the file. This can be immediately used to read the file. */
	absolutePath: AbsolutePath;
	/** Path of the file relative to the parent item. */
	path: ItemRelativePath;
	content: string;
	type: RegistryFileType | undefined;
	/** Templates for resolving imports when adding items to users projects. This way users can add their items anywhere and things will just work. */
	_imports_: UnresolvedImport[];
	target?: string;
	registryDependencies: string[] | undefined;
	dependencies: RemoteDependency[] | undefined;
	devDependencies: RemoteDependency[] | undefined;
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
	type: RegistryFileType | undefined;
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
	type: RegistryFileType;
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

		if (item.name === 'jsrepo' || item.name === 'registry')
			return err(new IllegalBlockNameError({ name: item.name, registryName: registry.name }));
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
	{ options, config }: { options: { cwd: AbsolutePath }; config: Config }
): Promise<Result<BuildResult, BuildError>> {
	const result = await validateRegistryConfig(registry);
	if (result.isErr()) return err(result.error);

	// flatten all the files that need to be resolved into a single array
	const preparedFilesResult = await collectItemFiles(registry.items, {
		cwd: options.cwd,
		registryName: registry.name,
	});
	if (preparedFilesResult.isErr()) return err(preparedFilesResult.error);
	const preparedFiles = preparedFilesResult.value;

	// resolve all the files
	const resolvedFilesResult = await resolveFiles(preparedFiles, {
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

/**
 * Collects all the files that need to be resolved into a single array.
 *
 * @param items
 * @param param1
 * @returns
 */
export async function collectItemFiles(
	items: RegistryItem[],
	{ cwd, registryName }: { cwd: AbsolutePath; registryName: string }
): Promise<Result<UnresolvedFile[], BuildError>> {
	const unresolvedFiles: UnresolvedFile[] = [];
	for (const item of items) {
		// all these files are at the root of the item and therefore should have absolute paths
		for (const file of item.files) {
			const absolutePath = joinAbsolute(cwd, file.path);
			if (!existsSync(absolutePath)) {
				return err(
					new FileNotFoundError({
						path: absolutePath,
						parent: {
							name: item.name,
							type: item.type,
						},
						registryName,
					})
				);
			}

			const isFile = statSync(absolutePath)._unsafeUnwrap().isFile();
			if (isFile) {
				unresolvedFiles.push({
					absolutePath,
					path: path.basename(file.path) as ItemRelativePath,
					type: item.type ?? file.type,
					target: file.target,
					dependencyResolution:
						file.dependencyResolution ?? item.dependencyResolution ?? 'auto',
					parent: {
						name: item.name,
						type: item.type,
						registryName,
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
								registryName,
								suggestion: 'Please ensure the directory exists and is readable.',
							}
						)
					);
				files = readdirResult.value.map((f) => ({
					path: f,
				}));
			}

			const subFilesResult = collectFolderFiles(files ?? [], {
				parent: {
					type: file.type ?? item.type,
					target: file.target,
					dependencyResolution: item.dependencyResolution ?? 'auto',
					parent: {
						name: item.name,
						type: item.type,
						registryName,
					},
					// we use the basename of the folder
					path: path.basename(file.path) as ItemRelativePath,
					absolutePath: absolutePath,
				},
				cwd,
			});
			if (subFilesResult.isErr()) return err(subFilesResult.error);
			unresolvedFiles.push(...subFilesResult.value);
		}
	}
	return ok(unresolvedFiles);
}

/**
 * Collects all the files in a folder into a single array.
 *
 * @param files
 * @param parent
 * @returns
 */
function collectFolderFiles(
	files: RegistryItemFolderFile[],
	{
		parent,
		cwd,
	}: {
		parent: {
			type: RegistryFileType;
			target: string | undefined;
			dependencyResolution: 'auto' | 'manual';
			parent: ParentItem;
			path: ItemRelativePath;
			absolutePath: AbsolutePath;
		};
		cwd: AbsolutePath;
	}
): Result<UnresolvedFile[], BuildError> {
	const unresolvedFiles: UnresolvedFile[] = [];
	for (const f of files) {
		const absolutePath = joinAbsolute(parent.absolutePath, f.path);
		if (!existsSync(absolutePath)) {
			return err(
				new FileNotFoundError({
					path: absolutePath,
					parent: {
						name: parent.parent.name,
						type: parent.parent.type,
					},
					registryName: parent.parent.registryName,
				})
			);
		}

		const isFile = statSync(absolutePath)._unsafeUnwrap().isFile();
		if (isFile) {
			unresolvedFiles.push({
				absolutePath,
				path: path.join(parent.path, f.path) as ItemRelativePath,
				type: f.type ?? parent.type,
				target: parent.target ? path.join(parent.target, f.path) : undefined,
				dependencyResolution: f.dependencyResolution ?? parent.dependencyResolution,
				parent: parent.parent,
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
						`Error reading directory: ${pc.bold(absolutePath)} referenced by ${pc.bold(parent.parent.name)}`,
						{
							registryName: parent.parent.registryName,
							suggestion: 'Please ensure the directory exists and is readable.',
						}
					)
				);
			files = readdirResult.value.map((f) => ({
				path: f,
			}));
		}

		const subFilesResult = collectFolderFiles(files ?? [], {
			parent: {
				parent: parent.parent,
				target: parent.target ? path.join(parent.target, f.path) : undefined,
				type: f.type ?? parent.type,
				dependencyResolution: parent.dependencyResolution,
				path: joinRelative(parent.path, f.path),
				absolutePath: joinAbsolute(parent.absolutePath, f.path),
			},
			cwd,
		});
		if (subFilesResult.isErr()) return err(subFilesResult.error);
		unresolvedFiles.push(...subFilesResult.value);
	}
	return ok(unresolvedFiles);
}

export async function resolveFiles(
	files: UnresolvedFile[],
	{
		cwd,
		resolvedFiles = new Map<NormalizedAbsolutePath, ResolvedFile>(),
		config,
		registry,
	}: {
		cwd: AbsolutePath;
		config: Config;
		registry: RegistryConfig;
		resolvedFiles?: ResolvedFiles;
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

		const resolveResult = await resolveFile(file, { cwd, config, registry });
		if (resolveResult.isErr()) return err(resolveResult.error);
		resolvedFiles.set(normalizedPath, resolveResult.value);
	}
	return ok(resolvedFiles);
}

async function resolveFile(
	file: UnresolvedFile,
	{ cwd, config, registry }: { cwd: AbsolutePath; config: Config; registry: RegistryConfig }
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
				warn: log.warn,
			});
			localDependencies = localDeps;
			dependencies = deps;
			devDependencies = devDeps;
		} else {
			log.warn(`Couldn't find a language to resolve dependencies for ${file.absolutePath}.`);
		}
	}

	return ok({
		absolutePath: file.absolutePath,
		path: file.path,
		// inherit the type from the parent item
		type: file.type ?? file.parent.type,
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
	items: RegistryItem[],
	{
		cwd,
		resolvedItems = new Map<string, ResolvedItem>(),
		resolvedFiles,
		registryName,
	}: {
		cwd: AbsolutePath;
		resolvedItems?: Map<string, ResolvedItem>;
		resolvedFiles: ResolvedFiles;
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
		cwd: AbsolutePath;
		resolvedItems: Map<string, ResolvedItem>;
		resolvedFiles: ResolvedFiles;
		registryName: string;
	}
): Promise<Result<ResolvedItem, BuildError>> {
	const preResolvedItem = resolvedItems.get(item.name);
	if (preResolvedItem) return ok(preResolvedItem);

	const files: RegistryFile[] = [];
	const registryDependencies = new Set<string>(item.registryDependencies ?? []);

	const dependenciesResult = toRemoteDependencies(item.dependencies ?? [], {
		registryName,
		itemName: item.name,
	});
	if (dependenciesResult.isErr()) return err(dependenciesResult.error);
	const dependencies = new Set(dependenciesResult.value);

	const devDependenciesResult = toRemoteDependencies(item.devDependencies ?? [], {
		registryName,
		itemName: item.name,
	});
	if (devDependenciesResult.isErr()) return err(devDependenciesResult.error);
	const devDependencies = new Set(devDependenciesResult.value);

	const itemFiles = Array.from(resolvedFiles.values()).filter(
		(file) => file.parent.name === item.name
	);

	for (const resolvedFile of itemFiles) {
		const resolvedResult = await resolveFileDependencies(resolvedFile, {
			item,
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
			dependencies.add(dep);
		}
		for (const dep of devDeps) {
			devDependencies.add(dep);
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
	});
}

async function resolveFileDependencies(
	resolvedFile: ResolvedFile,
	{ resolvedFiles, item }: { resolvedFiles: ResolvedFiles; item: RegistryItem; cwd: AbsolutePath }
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
	const optionalFileType = isOptionalFileType(resolvedFile.type);

	const _imports_: UnresolvedImport[] = [];

	const dependencies = new Set<RemoteDependency>();
	const devDependencies = new Set<RemoteDependency>();
	const registryDependencies = new Set<string>();

	const fileDependencies = new Set<RemoteDependency>(
		resolvedFile.manualDependencies.dependencies
	);
	const fileDevDependencies = new Set<RemoteDependency>(
		resolvedFile.manualDependencies.devDependencies
	);
	const fileRegistryDependencies = new Set<string>(
		resolvedFile.manualDependencies.registryDependencies
	);

	if (resolvedFile.dependencyResolution === 'auto') {
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

				// we don't need to resolve relative imports that reference the same item
				if (selfReference && dependency.import.startsWith('.')) {
					continue;
				}

				_imports_.push({
					import: dependency.import,
					item: localDependency.parent.name,
					meta: await dependency.createTemplate(localDependency),
				});
			} else {
				// only error if in strict mode
				if (item.strict === false) continue;
				console.dir(resolvedFiles.keys(), { depth: null });
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

		for (const dependency of resolvedFile.dependencies) {
			if (optionalFileType) {
				fileDependencies.add(dependency);
			} else {
				dependencies.add(dependency);
			}
		}

		for (const dependency of resolvedFile.devDependencies) {
			if (optionalFileType) {
				fileDevDependencies.add(dependency);
			} else {
				devDependencies.add(dependency);
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
			_imports_,
			registryDependencies: Array.from(fileRegistryDependencies),
			dependencies: Array.from(fileDependencies),
			devDependencies: Array.from(fileDevDependencies),
		},
		dependencies: Array.from(dependencies),
		devDependencies: Array.from(devDependencies),
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
	const remoteDependencies = new Set<RemoteDependency>();
	for (const dependency of dependencies) {
		let dep: RemoteDependency;
		if (typeof dependency === 'string') {
			const depResult = stringToRemoteDependency(dependency, { registryName, itemName });
			if (depResult.isErr()) return err(depResult.error);
			dep = depResult.value;
		} else {
			dep = dependency;
		}
		remoteDependencies.add(dep);
	}
	return ok(Array.from(remoteDependencies));
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

export function isOptionalFileType(
	type: RegistryFileType | undefined
): type is 'registry:example' | 'registry:doc' | 'registry:test' {
	return type === 'registry:example' || type === 'registry:doc' || type === 'registry:test';
}
