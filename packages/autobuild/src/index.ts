import type { RegistryConfig, RegistryConfigArgs, RegistryItem, RegistryMeta } from 'jsrepo/config';
import type { MaybeGetterAsync } from 'jsrepo/utils';
import { buildItems } from './build';

export type Options = RegistryMeta &
	BuildOptions & {
		outputs?: RegistryConfig['outputs'];
		excludeDeps?: RegistryConfig['excludeDeps'];
		plugins?: RegistryConfig['plugins'];
		defaultPaths?: RegistryConfig['defaultPaths'];
		additionalItems?: RegistryItem[];
	};

export type BuildOptions = {
	dirs: string[];
	includeBlocks?: string[];
	includeTypes?: string[];
	includeFiles?: string[];
	excludeBlocks?: string[];
	excludeTypes?: string[];
	doNotListBlocks?: string[];
	doNotListTypes?: string[];
	listBlocks?: string[];
	listTypes?: string[];
	excludeDeps?: string[];
	allowSubdirectories?: boolean;
	preview?: boolean;
	includeDocs?: boolean;
};

export function autobuild(options: Options): MaybeGetterAsync<RegistryConfig, RegistryConfigArgs> {
	return async (args) => {
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
			items: await buildItems(options, args),
		};
	};
}
