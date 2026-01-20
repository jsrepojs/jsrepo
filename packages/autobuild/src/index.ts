import type { RegistryConfig, RegistryItem, RegistryMeta } from 'jsrepo/config';

export type Options = RegistryMeta & BuildOptions & {
	outputs?: RegistryConfig['outputs'];
	excludeDeps?: RegistryConfig['excludeDeps'];
	plugins?: RegistryConfig['plugins'];
	defaultPaths?: RegistryConfig['defaultPaths'];
	additionalItems?: RegistryItem[];
}

export type BuildOptions = {
	dirs: string[];
	outputDir: string;
	includeBlocks?: string[];
	includeCategories?: string[];
	includeFiles?: string[];
	excludeBlocks?: string[];
	excludeCategories?: string[];
	doNotListBlocks?: string[];
	doNotListCategories?: string[];
	listBlocks?: string[];
	listCategories?: string[];
	excludeDeps?: string[];
	allowSubdirectories?: boolean;
	preview?: boolean;
	includeDocs?: boolean;
}

export function autobuild(options: Options): RegistryConfig {
	return {
		name: options.name,
		description: options.description,
		version: options.version,
		homepage: options.homepage,
		tags: options.tags,
		repository: options.repository,
		bugs: options.bugs,
		authors: options.authors,
		meta: options.meta,
		access: options.access,
		outputs: options.outputs,
		excludeDeps: options.excludeDeps,
		plugins: options.plugins,
		defaultPaths: options.defaultPaths,
		items: [...(options.additionalItems ?? [])],
	};
}
