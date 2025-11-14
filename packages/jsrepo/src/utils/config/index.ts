import { z } from 'zod';
import { DEFAULT_LANGS, type Language } from '@/langs';
import type { Output } from '@/outputs/types';
import { DEFAULT_PROVIDERS, type ProviderFactory } from '@/providers';
import type { RemoteDependency } from '@/utils/build';
import type { ItemRelativePath, LooseAutocomplete, Prettify } from '@/utils/types';
import { extract, type MaybeGetterAsync } from '@/utils/utils';

export type RegistryConfigArgs = [{ cwd: string }];

export type Config = {
	/** An array of registries to fetch items from.
	 * @example
	 * ```ts
	 * ["@ieedan/std", "@ieedan/shadcn-svelte-extras"]
	 * ```
	 */
	registries: string[];
	/** Define your registry or registries here. */
	registry:
		| MaybeGetterAsync<RegistryConfig, RegistryConfigArgs>
		| MaybeGetterAsync<RegistryConfig, RegistryConfigArgs>[]
		| RegistryConfig
		| RegistryConfig[];
	providers: ProviderFactory[];
	/** Use this to add support for additional languages. */
	languages: Language[];
	transforms: Transform[];
	/**
	 * Where to put items of a given type in your project. The key is the item type and the value is path where you want it to be added to your project.
	 * You can use the '*' key to set a default path for all item types. Specify the path for a custom item with `<type>/<name>`.
	 * @example
	 * ```ts
	 * import { defineConfig } from "jsrepo";
	 *
	 * export default defineConfig({
	 *  // ...
	 *  paths: {
	 *    "*": "./src/items",
	 *    ui: "./src/ui",
	 *    "ui/button": "./components/ui",
	 *  }
	 * });
	 * ```
	 */
	paths: {
		[key in RegistryItemType | '*']?: string;
	};
};

export const RegistryMetaSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	version: z.string().optional(),
	homepage: z.string().optional(),
	tags: z.array(z.string()).optional(),
	repository: z.string().optional(),
	bugs: z.string().optional(),
	authors: z.array(z.string()).optional(),
	meta: z.record(z.string(), z.string()).optional(),
	access: z.enum(['public', 'private', 'marketplace']).optional(),
});

export type RegistryMeta = {
	/**
	 * The name of the registry. When publishing to [jsrepo.com](https://jsrepo.com) the name must follow the format of `@<scope>/<name>`.
	 */
	name: string;
	description?: string;
	/**
	 * The version of the registry. When publishing to [jsrepo.com](https://jsrepo.com) the version can be provided as `package` to use the version from the `package.json` file, otherwise it should be a valid semver version.
	 */
	version?: LooseAutocomplete<'package'>;
	homepage?: string;
	tags?: string[];
	repository?: string;
	bugs?: string;
	authors?: string[];
	meta?: Record<string, string>;
	/** The access level of the registry when published to jsrepo.com with `jsrepo publish`.
	 *
	 *  - "public" - The registry will be visible to everyone
	 *  - "private" - The registry will be visible to only you
	 *  - "marketplace" - The registry will purchasable on the jsrepo.com marketplace
	 *
	 *  @default "public"
	 */
	access?: 'public' | 'private' | 'marketplace';
};

export type RegistryConfig = RegistryMeta & {
	/** These dependencies will not be installed with registry items even if detected. */
	excludeDeps?: string[];
	items: RegistryItem[];
	/** An array of output strategies. These allow you to customize the way your registry is distributed. */
	outputs?: Output[];
	/** Plugins that users need to install to use your registry. (Will be installed automatically when initializing your registry)*/
	plugins?: {
		languages?: RegistryPlugin[];
		providers?: RegistryPlugin[];
		transforms?: RegistryPlugin[];
	};
	/** The default path for each item type. You can also provide the path for a specific item with `<type>/<name>`. */
	defaultPaths?: {
		[key in RegistryItemType]?: string;
	};
};

export type RegistryPlugin = {
	/** The name of the package */
	package: string;
	/** The version of the package */
	version?: string | undefined;
	/** Whether the plugin is optional. @default false */
	optional?: boolean;
};

export type RegistryItemType = LooseAutocomplete<
	'block' | 'component' | 'lib' | 'hook' | 'ui' | 'page'
>;

export const RegistryItemAddSchema = z.enum([
	'optionally-on-init',
	'on-init',
	'when-needed',
	'when-added',
]);

export type RegistryItemAdd = z.infer<typeof RegistryItemAddSchema>;

export type RegistryItem = {
	/** The name of the item. MUST be unique. Spaces are NOT allowed. */
	name: string;
	/** Human readable title of the item */
	title?: string;
	/** The type of the item. This can be any string. Users will configure their paths based on this type. */
	type: RegistryItemType;
	/** The description of the item not user visible but great for LLMs. */
	description?: string;
	/** Paths to the files that are required for the item to work. */
	files: RegistryItemFile[];
	/**
	 * Requires that all dependencies of the item must be part of the registry.
	 *
	 * @default true
	 */
	strict?: boolean;
	/** Whether the dependency resolution should be automatic or manual. @default "auto" */
	dependencyResolution?: 'auto' | 'manual';
	/**
	 * Dependencies to other items in the registry. For many languages these can be automatically detected but can also be nice if there is another item you need that cannot be detected. They should be in the format of `<name>`.
	 * @example
	 * ```ts
	 * {
	 *  // ...
	 *  registryDependencies: ["<name>"]
	 * }
	 * ```
	 */
	registryDependencies?: string[];
	/**
	 * Provide a list of dependencies to be installed with the item. If dependencies are provided as a string they will be assumed to be a js dependency.
	 */
	dependencies?: (RemoteDependency | string)[];
	/**
	 * Provide a list of devDependencies to be installed with the item. If dependencies are provided as a string they will be assumed to be a js dependency.
	 */
	devDependencies?: (RemoteDependency | string)[];
	/**
	 * Controls when the item will be added to the project.
	 *
	 * - "on-init" - Added on registry init or when it's needed by another item
	 * - "when-needed" - Not listed and only added when another item is added that depends on it
	 * - "when-added" - Added when the user selects it to be added
	 *
	 * @default "when-added"
	 */
	add?: RegistryItemAdd;
	/**
	 * Environment variables that are required for the item to work. These will be added to the users `.env` or `.env.local` file. NEVER ADD SECRETS HERE.
	 */
	envVars?: Record<string, string>;
};

export const RegistryFileRoles = ['example', 'doc', 'test', 'file'] as const;

export type RegistryFileRoles = (typeof RegistryFileRoles)[number];

export type RegistryItemFile = {
	/** Path of the file/folder relative to registry config. */
	path: string;
	/**
	 * The type of the file. This will determine the path that the file will be added to in the users project.
	 */
	type?: RegistryItemType;
	/**
	 * The role of the file.
	 *
	 * - "file" - A regular file (always installed)
	 * - "example" - An example file (optionally installed, great for LLMs)
	 * - "test" - A test file (optionally installed)
	 * - "doc" - A documentation file (optionally installed, great for LLMs)
	 *
	 * If a parent folder has a role this file will inherit the role from the parent folder.
	 *
	 * @default "file"
	 */
	role?: RegistryFileRoles;
	/**
	 * Whether the dependency resolution should be automatic or manual.
	 * @default "auto"
	 *
	 * @remarks when this option is set on the parent registry item this option will have no effect
	 */
	dependencyResolution?: 'auto' | 'manual';
	/**
	 * The target path for this file in the users project. Overrides all other path settings.
	 */
	target?: string;
	/**
	 * Dependencies to other items in the registry. For many languages these can be automatically detected but can also be nice if there is another item you need that cannot be detected. They should be in the format of `<name>`.
	 * @example
	 * ```ts
	 * {
	 *  // ...
	 *  registryDependencies: ["<name>"]
	 * }
	 * ```
	 */
	registryDependencies?: string[];
	/**
	 * Provide a list of dependencies to be installed with the item. If dependencies are provided as a string they will be assumed to be a js dependency.
	 */
	dependencies?: (RemoteDependency | string)[];
	/**
	 * Provide a list of devDependencies to be installed with the item. If dependencies are provided as a string they will be assumed to be a js dependency.
	 */
	devDependencies?: (RemoteDependency | string)[];
	/**
	 * Only valid as children of a folder. Allows you to individually configure each file in the folder.
	 */
	files?: RegistryItemFolderFile[];
};

export type RegistryItemFolderFile = Prettify<
	Omit<RegistryItemFile, 'target' | 'type' | 'path'> & {
		/**
		 * Path to the file relative to the parent folder.
		 */
		path: string;
	}
>;

export type TransformOptions = {
	cwd: string;
	registryUrl: string;
	item: {
		name: string;
		type: RegistryItemType;
	};
};

export type Transform = {
	transform: (opts: {
		code: string;
		fileName: ItemRelativePath;
		options: TransformOptions;
	}) => Promise<{ code?: string; fileName?: ItemRelativePath }>;
};

export function defineConfig(config: Partial<Config> | (() => Partial<Config>)): Config {
	const c = extract(config);

	return {
		providers: c.providers ?? DEFAULT_PROVIDERS,
		registries: c.registries ?? [],
		registry: c.registry ?? [],
		languages: c.languages ?? DEFAULT_LANGS,
		transforms: c.transforms ?? [],
		paths: c.paths ?? {},
	};
}
