import {
	JsrepoError,
	type Output,
	type RegistryConfig,
	type RegistryItem,
	type RemoteDependency,
} from 'jsrepo';
import type { registryItemFileSchema } from 'shadcn-svelte/schema';
import { parsePackageName } from './utils';

export * from './output';

export type ShadcnSvelteRegistryItemType =
	(typeof registryItemFileSchema.shape.type.options)[number];

export type ShadcnSvelteRegistry = {
	name: string;
	homepage: string;
	excludeDeps: string[];
	items: ShadcnSvelteRegistryItem[];
	outputs: Output[];
};

export type ShadcnSvelteRegistryItem = {
	name: string;
	/** Human readable title of the item */
	title?: string;
	type: ShadcnSvelteRegistryItemType;
	description?: string;
	files: Array<
		| {
				path: string;
				type: 'registry:file' | 'registry:page';
				target: string;
		  }
		| {
				path: string;
				type: Exclude<ShadcnSvelteRegistryItemType, 'registry:file' | 'registry:page'>;
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
	 * Organize your registry item.
	 */
	categories?: string[];
	/**
	 * Add additional metadata to your registry item.
	 */
	meta?: Record<string, string>;
};

export function defineShadcnSvelteRegistry(registry: ShadcnSvelteRegistry): RegistryConfig {
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
