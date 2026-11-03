import fs from 'node:fs';
import path from 'node:path';
import { JsrepoError, type RemoteDependency, type StringifyFormat, stringify } from 'jsrepo';
import type { Output } from 'jsrepo/outputs';
import {
	type RegistryItem,
	type RegistryItemFileType,
	type RegistryItemType,
	registryIndexSchema,
	registryItemFileSchema,
	registryItemSchema,
} from 'shadcn-svelte/schema';

export type OutputOptions = {
	/**
	 * Controls how the JSON files are formatted.
	 *
	 * @default true
	 */
	format?: StringifyFormat;
	/**
	 * The directory to output the registry to. (ex: `./static/r`)
	 */
	dir: string;
	/**
	 * `aliases` define how your registry's internal import paths will be transformed when users install your components. These should match how you import components within your registry code.
	 *
	 * For example, if your registry's component has:
	 *
	 * ```svelte
	 * <script lang="ts">
	 * 	import { Button } from "$lib/registry/ui/button/index.js";
	 * 	import { cn } from "$lib/utils.js";
	 * </script>
	 * ```
	 *
	 * Then your aliases should match:
	 *
	 * ```json
	 * {
	 * 	"aliases": {
	 * 		"lib": "$lib", // Matches your internal imports
	 * 		"ui": "$lib/registry/ui", // Matches your internal imports
	 * 		"components": "$lib/registry/components", // Matches your internal imports
	 * 		"utils": "$lib/utils", // Matches your internal imports
	 * 		"hooks": "$lib/hooks" // Matches your internal imports
	 * 	}
	 * }
	 * ```
	 *
	 * Any alias you don't provide falls back to the same default used by the `shadcn-svelte registry build` command.
	 *
	 * @see https://shadcn-svelte.com/docs/registry/registry-json#aliases
	 */
	aliases?: Partial<Record<Alias, string>>;
	/**
	 * Remap the types of items in your registry to the correct shadcn-svelte type.
	 *
	 * @example
	 * ```ts
	 * { util: "registry:lib", action: "registry:lib" }
	 * ```
	 */
	typeMap?: Record<string, RegistryItemType>;
};

const ALIASES = ['components', 'ui', 'hooks', 'utils', 'lib'] as const;

type Alias = (typeof ALIASES)[number];

/**
 * Mirrors the defaults used by `shadcn-svelte registry build` so that the output
 * is interchangeable with a registry built by the shadcn-svelte CLI.
 */
const ALIAS_DEFAULTS: Record<Alias, { placeholder: string; defaultPath: string }> =
	Object.fromEntries(
		ALIASES.map((alias) => [
			alias,
			{
				placeholder: `$${alias.toUpperCase()}$`,
				defaultPath: alias === 'utils' ? '$lib/utils' : `$lib/registry/${alias}`,
			},
		])
	) as Record<Alias, { placeholder: string; defaultPath: string }>;

/** Files with these roles are for the registry's own development and should never be installed. */
const SKIPPED_ROLES = new Set(['example', 'doc', 'test']);

const SCHEMA_URL = 'https://shadcn-svelte.com/schema/registry-item.json';

export function output(options: OutputOptions): Output {
	const aliasPaths = resolveAliasPaths(options.aliases);

	return {
		output: async (buildResult, { cwd }) => {
			const itemNames = new Set(buildResult.items.map((item) => item.name));

			if (itemNames.has('index')) {
				throw new JsrepoError(
					`${buildResult.name} has an item named "index" which conflicts with the registry index.json file.`,
					{ suggestion: 'Please rename the item.' }
				);
			}

			// items that have nothing to install (ex: only examples) are not part of the output
			const installable = buildResult.items.filter((item) =>
				item.files.some((file) => !SKIPPED_ROLES.has(file.role))
			);
			const installableNames = new Set(installable.map((item) => item.name));

			const items: RegistryItem[] = installable.map((item) => {
				const itemType = resolveType(item.type, options.typeMap);
				assertValidType(itemType, item.name);

				const registryDependencies = (item.registryDependencies ?? []).map((dep) => {
					if (itemNames.has(dep) && !installableNames.has(dep)) {
						throw new JsrepoError(
							`${item.name} depends on ${dep} but ${dep} has no files that can be installed.`,
							{
								suggestion: `Please make sure ${dep} has at least one file that isn't an example, doc, or test.`,
							}
						);
					}
					return toRegistryDependency(dep, itemNames);
				});

				const files = item.files
					.filter((file) => !SKIPPED_ROLES.has(file.role))
					.map((file) => {
						const fileType = resolveType(file.type, options.typeMap);
						assertValidType(fileType, `${file.path} on ${item.name}`);

						if (
							(fileType === 'registry:page' || fileType === 'registry:file') &&
							file.target === undefined
						) {
							throw new JsrepoError(
								`Target is required for registry items with type ${fileType}. Please provide a target for ${file.path} on ${item.name}`,
								{ suggestion: 'Please provide a target for the file.' }
							);
						}

						return {
							content: transformAliases(aliasPaths, file.content),
							type: fileType,
							target: resolveTarget({
								itemName: item.name,
								file,
								fileType,
								aliasPaths,
							}),
						};
					});

				return {
					$schema: SCHEMA_URL,
					name: item.name,
					title: item.title,
					type: itemType,
					description: item.description,
					dependencies: toDependencies(item.dependencies),
					devDependencies: toDependencies(item.devDependencies),
					// the CLI omits this on the item when there aren't any (it's still included in the index)
					registryDependencies:
						registryDependencies.length > 0 ? registryDependencies : undefined,
					meta: item.meta,
					categories: item.categories,
					files,
				} satisfies RegistryItem;
			});

			// contain errors to this plugin so there aren't issues for users
			for (const item of items) {
				const parsed = registryItemSchema.safeParse(item);
				if (!parsed.success) {
					throw new JsrepoError(`Invalid item ${item.name}: ${parsed.error.message}`, {
						suggestion:
							"This one's on us. Please file an issue at https://github.com/jsrepojs/jsrepo/issues",
					});
				}
			}

			const index = items.map((item) => ({
				name: item.name,
				title: item.title,
				type: item.type,
				description: item.description,
				dependencies: item.dependencies,
				devDependencies: item.devDependencies,
				registryDependencies: item.registryDependencies ?? [],
				meta: item.meta,
				relativeUrl: `${item.name}.json`,
			}));

			const parsedIndex = registryIndexSchema.safeParse(index);
			if (!parsedIndex.success) {
				throw new JsrepoError(
					`Invalid registry index for ${buildResult.name}: ${parsedIndex.error.message}`,
					{
						suggestion:
							"This one's on us. Please file an issue at https://github.com/jsrepojs/jsrepo/issues",
					}
				);
			}

			const outDir = path.join(cwd, options.dir);
			fs.mkdirSync(outDir, { recursive: true });

			fs.writeFileSync(
				path.join(outDir, 'index.json'),
				stringify(index, { format: options.format })
			);
			for (const item of items) {
				fs.writeFileSync(
					path.join(outDir, `${item.name}.json`),
					stringify(item, { format: options.format })
				);
			}
		},
		clean: async ({ cwd }) => {
			const outDir = path.join(cwd, options.dir);
			if (!fs.existsSync(outDir)) return;
			fs.rmSync(outDir, { recursive: true });
		},
	};
}

function resolveAliasPaths(aliases: OutputOptions['aliases']): Record<Alias, string> {
	return Object.fromEntries(
		ALIASES.map((alias) => [alias, aliases?.[alias] ?? ALIAS_DEFAULTS[alias].defaultPath])
	) as Record<Alias, string>;
}

/**
 * Replaces the registry's internal import paths with the placeholders that the shadcn-svelte CLI
 * swaps for the user's own aliases when the item is added.
 *
 * Matches the behavior of `shadcn-svelte registry build` (including the order aliases are replaced in).
 */
function transformAliases(aliasPaths: Record<Alias, string>, content: string): string {
	let result = content;
	for (const alias of ALIASES) {
		result = result.replaceAll(aliasPaths[alias], ALIAS_DEFAULTS[alias].placeholder);
	}
	return result;
}

function resolveType(type: string | undefined, typeMap: OutputOptions['typeMap']): string {
	// this way we don't require a type by default
	if (!type) return 'registry:ui';
	const mapped = typeMap?.[type];
	if (mapped !== undefined) return mapped;
	return type.startsWith('registry:') ? type : `registry:${type}`;
}

function assertValidType(
	type: string,
	label: string
): asserts type is Exclude<RegistryItemFileType, 'registry:base' | 'registry:font'> {
	if (type === 'registry:base' || type === 'registry:font') {
		throw new JsrepoError(`${label} is of type ${type} and cannot be added to the registry.`, {
			suggestion: 'Please remove it from the registry.',
		});
	}
	const parsed = registryItemFileSchema.shape.type.safeParse(type);
	if (!parsed.success) {
		throw new JsrepoError(
			`Invalid type: ${type} for ${label}. Expected one of: ${registryItemFileSchema.shape.type.options.join(', ')}`,
			{
				suggestion: 'Please use a valid type or remap the type using the `typeMap` option.',
			}
		);
	}
}

/**
 * Determines where shadcn-svelte will install the file.
 *
 * - By default the file's path relative to its item is used (ex: `button/index.ts`). The CLI resolves this
 *   relative to the alias directory for the type of the file.
 * - `~/` targets are relative to the root of the user's project and are passed through as is.
 * - `registry:file` and `registry:page` targets use the shadcn-svelte semantics and are passed through as is.
 * - Other targets must be inside the alias directory for their type (ex: `$lib/components/ui/button.svelte`)
 *   which is stripped, since shadcn-svelte targets are always relative to that directory.
 */
function resolveTarget({
	itemName,
	file,
	fileType,
	aliasPaths,
}: {
	itemName: string;
	file: { path: string; target?: string };
	fileType: RegistryItemFileType;
	aliasPaths: Record<Alias, string>;
}): string {
	if (file.target === undefined) return toPosixPath(file.path);

	const target = toPosixPath(file.target);

	if (target.startsWith('~/')) return target;
	if (fileType === 'registry:file' || fileType === 'registry:page') return target;

	const alias = aliasForType(fileType);
	if (alias === undefined) return target;

	const aliasPath = aliasPaths[alias].replace(/\/+$/, '');
	if (target.startsWith(`${aliasPath}/`)) return target.slice(aliasPath.length + 1);

	throw new JsrepoError(
		`Target ${target} for ${file.path} on ${itemName} is outside of the \`${alias}\` alias (${aliasPath}).`,
		{
			suggestion: `shadcn-svelte installs ${fileType} files relative to the \`${alias}\` alias. Either update the target to start with \`${aliasPath}/\`, start it with \`~/\` to make it relative to the project root, or set the \`aliases.${alias}\` option on your output.`,
		}
	);
}

function aliasForType(type: RegistryItemFileType): Alias | undefined {
	switch (type) {
		case 'registry:ui':
			return 'ui';
		case 'registry:hook':
			return 'hooks';
		case 'registry:lib':
			return 'lib';
		case 'registry:component':
		case 'registry:block':
			return 'components';
		default:
			return undefined;
	}
}

/** In registry dependencies are relative URLs so that `shadcn-svelte add https://host/r/item.json` can resolve them. */
function toRegistryDependency(dep: string, itemNames: Set<string>): string {
	if (/^https?:\/\//.test(dep) || dep.startsWith('./') || dep.startsWith('../')) return dep;
	return itemNames.has(dep) ? `./${dep}.json` : dep;
}

function toDependencies(deps: RemoteDependency[] | undefined): string[] | undefined {
	if (deps === undefined) return undefined;

	// jsrepo can resolve the same package from multiple places (ex: listed manually and from package.json)
	const byName = new Map<string, RemoteDependency>();
	for (const dep of deps) {
		if (dep.ecosystem !== 'js') continue;
		const existing = byName.get(dep.name);
		if (
			existing === undefined ||
			(existing.version === undefined && dep.version !== undefined)
		) {
			byName.set(dep.name, dep);
		}
	}

	if (byName.size === 0) return undefined;

	return Array.from(byName.values(), (dep) =>
		dep.version ? `${dep.name}@${dep.version}` : dep.name
	);
}

/** Normalize path segments for POSIX-style registry targets */
function toPosixPath(segment: string) {
	return segment.replaceAll('\\', '/');
}
