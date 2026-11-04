import { z } from 'zod';
import { DEFAULT_LANGS, type Language } from '@/langs';
import type { Output } from '@/outputs/types';
import { DEFAULT_PROVIDERS, type ProviderFactory } from '@/providers';
import type { RemoteDependency, UnresolvedFile } from '@/utils/build';
import { JsrepoError } from '@/utils/errors';
import type { AfterHook, BeforeHook } from '@/utils/hooks';
import type {
	AbsolutePath,
	ItemRelativePath,
	LooseAutocomplete,
	MaybePromise,
	Prettify,
} from '@/utils/types';
import { extract, type MaybeGetterAsync } from '@/utils/utils';
import type { Warning } from '@/utils/warnings';

export type RegistryConfigArgs = [{ cwd: string }];

export type RemoteDependencyResolverOptions = {
	cwd: AbsolutePath;
};

export type RemoteDependencyResolver = (
	dep: RemoteDependency,
	options: RemoteDependencyResolverOptions
) => MaybePromise<RemoteDependency>;

export type BuildTransform = {
	transform: (
		content: string,
		opts: { cwd: AbsolutePath; file: UnresolvedFile }
	) => MaybePromise<{ content: string }>;
};

/**
 * A plugin bundles everything an integration can contribute to jsrepo (providers, languages, transforms and build settings) behind a single entry in `plugins`.
 *
 * Plugin packages should export a function that returns a `Plugin` as their default export so that the `jsrepo` CLI can add them to your config.
 *
 * @example
 * ```ts
 * import type { Plugin } from "jsrepo";
 *
 * export default function myPlugin(): Plugin {
 *   return {
 *     name: "my-plugin",
 *     providers: [myProvider()],
 *     build: { remoteDependencyResolver: myResolver },
 *   };
 * }
 * ```
 */
export type Plugin = {
	/** The name of the plugin. Used in error messages. */
	name: string;
	/** Providers the plugin adds. These are checked before the default providers. */
	providers?: ProviderFactory[];
	/** Languages the plugin adds. These are checked before the default languages. */
	languages?: Language[];
	/** Transforms that run (in order) on registry items when they are added to a project. */
	transforms?: Transform[];
	/** Settings for `jsrepo build`. */
	build?: PluginBuild;
};

export type PluginBuild = {
	/** Transforms that run (in order) on the content of each file before it is added to the built registry output. */
	transforms?: BuildTransform[];
	/**
	 * Resolve each remote dependency before it is added to the built registry output.
	 * When multiple resolvers are configured they run in order with each receiving the result of the previous one.
	 */
	remoteDependencyResolver?: RemoteDependencyResolver;
};

export type Config = {
	/**
	 * Plugins that add providers, languages, transforms and build settings.
	 * @example
	 * ```ts
	 * import { defineConfig } from "jsrepo";
	 * import prettier from "@jsrepo/transform-prettier";
	 * import shadcn from "@jsrepo/shadcn";
	 *
	 * export default defineConfig({
	 *   plugins: [prettier(), shadcn()],
	 * });
	 * ```
	 */
	plugins: Plugin[];
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
	build: {
		/**
		 * Custom warning handler. If not provided, warnings will be logged using the default logger.
		 *
		 * @example
		 * ```ts
		 * import { defineConfig } from "jsrepo";
		 * import { InvalidImportWarning } from "jsrepo/warnings";
		 *
		 * export default defineConfig({
		 *   // ...
		 *   onwarn: (warning, handler) => {
		 *     if (warning instanceof InvalidImportWarning) {
		 *       // Skip warnings for $app/server and $app/navigation imports
		 *       if (['$app/server', '$app/navigation'].includes(warning.specifier)) {
		 *         return;
		 *       }
		 *     }
		 *     handler(warning);
		 *   }
		 * });
		 * ```
		 */
		onwarn?: (warning: Warning, handler: (message: Warning) => void) => void;
		transforms?: BuildTransform[];
		/**
		 * Resolve each remote dependency before it is added to the built registry output.
		 * Useful for rewriting protocol-based versions (e.g. `workspace:*`, `catalog:`).
		 */
		remoteDependencyResolver?: RemoteDependencyResolver;
	};
	/**
	 * Custom warning handler. If not provided, warnings will be logged using the default logger.
	 *
	 * @deprecated Use `build.onwarn` instead.
	 *
	 * @example
	 * ```ts
	 * import { defineConfig } from "jsrepo";
	 * import { InvalidImportWarning } from "jsrepo/warnings";
	 *
	 * export default defineConfig({
	 *   // ...
	 *   onwarn: (warning, handler) => {
	 *     if (warning instanceof InvalidImportWarning) {
	 *       // Skip warnings for $app/server and $app/navigation imports
	 *       if (['$app/server', '$app/navigation'].includes(warning.specifier)) {
	 *         return;
	 *       }
	 *     }
	 *     handler(warning);
	 *   }
	 * });
	 * ```
	 */
	onwarn?: (warning: Warning, handler: (message: Warning) => void) => void;
	/**
	 * Lifecycle hooks run before and after CLI commands.
	 * @example
	 * ```ts
	 * import { defineConfig } from "jsrepo";
	 *
	 * export default defineConfig({
	 *   hooks: {
	 *     before: ({ command }) => console.log(`Running ${command}...`),
	 *     after: "echo done",
	 *   },
	 * });
	 * ```
	 */
	hooks?: {
		after?: AfterHook | AfterHook[];
		before?: BeforeHook | BeforeHook[];
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
	/**
	 * Plugins that users need to install to use your registry. (Will be installed automatically when initializing your registry)
	 *
	 * Provide an array of plugin packages to add them to the `plugins` array of the users config.
	 * Providing an object with `languages`, `providers`, and `transforms` is still supported for plugins that haven't adopted the unified plugin API.
	 */
	plugins?: RegistryPlugins;
	/** The default path for each item type. You can also provide the path for a specific item with `<type>/<name>`. */
	defaultPaths?: {
		[key in RegistryItemType]?: string;
	};
};

export type RegistryPlugins =
	| RegistryPlugin[]
	| {
			languages?: RegistryPlugin[];
			providers?: RegistryPlugin[];
			transforms?: RegistryPlugin[];
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

export const RegistryItemAddOptions = [
	'optionally-on-init',
	'on-init',
	'when-needed',
	'when-added',
] as const;
export const RegistryItemAddSchema = z.enum(RegistryItemAddOptions);
export type RegistryItemAdd = (typeof RegistryItemAddOptions)[number];

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
	categories?: string[];
	meta?: Record<string, string>;
};

/** Built-in file roles. Custom roles are allowed. */
export const RegistryFileRoles = ['example', 'doc', 'test', 'file'] as const;

export type BuiltinRegistryFileRole = (typeof RegistryFileRoles)[number];
export type RegistryFileRoles = LooseAutocomplete<BuiltinRegistryFileRole>;

export type RegistryItemFile = {
	/** Path of the file/folder relative to registry config. */
	path: string;
	/**
	 * The type of the file. This will determine the path that the file will be added to in the users project.
	 */
	type?: RegistryItemType;
	/**
	 * The role of the file. Roles are arbitrary strings.
	 *
	 * - "file" - A regular file (always installed)
	 * - "example" - An example file (optionally installed, great for LLMs)
	 * - "test" - A test file (optionally installed)
	 * - "doc" - A documentation file (optionally installed, great for LLMs)
	 *
	 * Any role other than "file" is considered optional and is only included when
	 * the user passes `--with <role>`.
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
	/**
	 * Include additional metadata on the item. (Available to LLMs when using the `@jsrepo/mcp` server)
	 */
	meta?: Record<string, string>;
};

export type RegistryItemFolderFile = Prettify<
	Omit<RegistryItemFile, 'target' | 'type' | 'path'> & {
		/**
		 * Path to the file/folder relative to the parent folder.
		 */
		path: string;
	}
>;

export type TransformOptions = {
	cwd: AbsolutePath;
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

	const plugins = c.plugins ?? [];
	validatePlugins(plugins);

	const providers = unique([
		// plugins go first so they can take precedence over the defaults
		...plugins.flatMap((plugin) => plugin.providers ?? []),
		...(c.providers ?? DEFAULT_PROVIDERS),
	]);
	const languages = unique([
		...plugins.flatMap((plugin) => plugin.languages ?? []),
		...(c.languages ?? DEFAULT_LANGS),
	]);
	const transforms = unique([
		...(c.transforms ?? []),
		...plugins.flatMap((plugin) => plugin.transforms ?? []),
	]);
	const buildTransforms = unique([
		...(c.build?.transforms ?? []),
		...plugins.flatMap((plugin) => plugin.build?.transforms ?? []),
	]);
	const remoteDependencyResolver = composeRemoteDependencyResolvers([
		c.build?.remoteDependencyResolver,
		...plugins.map((plugin) => plugin.build?.remoteDependencyResolver),
	]);

	return {
		plugins,
		providers,
		registries: c.registries ?? [],
		registry: c.registry ?? [],
		languages,
		transforms,
		paths: c.paths ?? {},
		hooks: c.hooks,
		build: {
			...c.build,
			onwarn: c.build?.onwarn ?? c.onwarn,
			transforms: buildTransforms,
			remoteDependencyResolver,
		},
	};
}

function unique<T>(items: T[]): T[] {
	return Array.from(new Set(items));
}

function validatePlugins(plugins: unknown[]) {
	if (!Array.isArray(plugins)) {
		throw new JsrepoError('The `plugins` option must be an array.', {
			suggestion: 'Wrap your plugin in an array. ex: `plugins: [myPlugin()]`',
		});
	}

	for (const [index, plugin] of plugins.entries()) {
		if (
			typeof plugin !== 'object' ||
			plugin === null ||
			typeof (plugin as { name?: unknown }).name !== 'string'
		) {
			throw new JsrepoError(`Invalid plugin at \`plugins[${index}]\`.`, {
				suggestion:
					'Plugins must be an object with a `name`. If this is a provider, language, or transform from an older package add it to `providers`, `languages`, or `transforms` instead.',
			});
		}
	}
}

/** Runs each resolver in order passing the output of one as the input to the next. */
function composeRemoteDependencyResolvers(
	resolvers: (RemoteDependencyResolver | undefined)[]
): RemoteDependencyResolver | undefined {
	const defined = resolvers.filter((r): r is RemoteDependencyResolver => r !== undefined);
	if (defined.length <= 1) return defined[0];

	return async (dep, options) => {
		let resolved = dep;
		for (const resolver of defined) {
			resolved = await resolver(resolved, options);
		}
		return resolved;
	};
}
