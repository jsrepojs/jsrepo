import {
	JsrepoError,
	type Output,
	type RegistryConfig,
	type RegistryItem,
	type RemoteDependency,
} from 'jsrepo';
import type { registryItemTypeSchema } from 'shadcn/schema';
import { parsePackageName } from './utils';

export * from './output';

export { provider as default } from './provider';

export type ShadcnRegistryItemType = (typeof registryItemTypeSchema.options)[number];

export type ShadcnRegistry = {
	name: string;
	homepage: string;
	excludeDeps: string[];
	items: ShadcnRegistryItem[];
	outputs: Output[];
};

export type ShadcnRegistryItem = {
	name: string;
	/** Human readable title of the item */
	title?: string;
	type: ShadcnRegistryItemType;
	description?: string;
	files: Array<
		| {
				path: string;
				type: 'registry:file' | 'registry:page';
				target: string;
		  }
		| {
				path: string;
				type: Exclude<ShadcnRegistryItemType, 'registry:file' | 'registry:page'>;
				target?: string;
		  }
	>;
	/**
	 * Requires that all dependencies of the item must be part of the registry.
	 *
	 * @default true
	 */
	strict?: boolean;
	/** Whether the dependency resolution should be automatic or manual. @default "auto" */
	dependencyResolution?: 'auto' | 'manual';
	registryDependencies?: string[];
	dependencies?: string[];
	/**
	 * Environment variables that are required for the item to work. These will be added to the users `.env` or `.env.local` file. NEVER ADD SECRETS HERE.
	 */
	envVars?: Record<string, string>;
	/**
	 * Organize your registry item.
	 */
	categories?: string[];
	/**
	 * Add additional metadata to your registry item.
	 */
	meta?: Record<string, string>;
};

export function defineShadcnRegistry(registry: ShadcnRegistry): RegistryConfig {
	return {
		...registry,
		items: registry.items.map((item) => {
			return {
				...item,
				dependencies: item.dependencies?.map((dependency) => {
					const parsed = parsePackageName(dependency);
					if (parsed === undefined) {
						throw new JsrepoError(`Invalid package name: ${dependency}`, {
							suggestion: 'Please provide a valid package name.',
						});
					}
					return {
						ecosystem: 'js',
						name: parsed.name,
						version: parsed.version,
					} satisfies RemoteDependency;
				}),
			} satisfies RegistryItem;
		}),
	};
}
