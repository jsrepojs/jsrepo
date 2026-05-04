import fs from 'node:fs';
import path from 'node:path';
import { detectPackageManager, JsrepoError } from 'jsrepo';
import type { Output } from 'jsrepo/outputs';
import { resolveCommand } from 'package-manager-detector';
import {
	type Registry,
	type RegistryItem,
	type RegistryItemType,
	registryItemFileSchema,
	registryItemSchema,
	registrySchema,
} from 'shadcn-svelte/schema';
import { x } from 'tinyexec';

export type OutputOptions = {
	format?: boolean;
	dir: string;
	/**
	 * `aliases` define how your registry's internal import paths will be transformed when users install your components. These should match how you import components within your registry code.
	 *
	 * For example, if your registry's component has:
	 *
	 * ```svelte
	 * <script lang="ts">
	 * 	import { Button } from "@/lib/registry/ui/button/index.js";
	 * 	import { cn } from "@/lib/utils.js";
	 * </script>
	 * ```
	 *
	 * Then your `registry.json` should have matching aliases:
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
	 * @see https://shadcn-svelte.com/docs/registry/registry-json#aliases
	 */
	aliases?: Record<string, string>;
	/**
	 * Should the temporary registry json file be cleaned up on failure?
	 *
	 * @default true
	 */
	cleanOnFailure?: boolean;
	/**
	 * Remap the types of items in your registry to the correct shadcn-svelte type.
	 */
	typeMap?: Record<string, RegistryItemType>;
};

export function output(options: OutputOptions): Output {
	const cleanOnFailure = options.cleanOnFailure ?? true;
	const getType = (type: string | undefined) => {
		// this way we don't require target by default
		if (!type) return 'registry:ui';
		if (options.typeMap?.[type]) return options.typeMap[type];
		return type.startsWith('registry:') ? type : `registry:${type}`;
	};

	return {
		output: async (buildResult, { cwd }) => {
			if (buildResult.homepage === undefined) {
				throw new JsrepoError(`No homepage was provided for ${buildResult.name}`, {
					suggestion: 'Please provide a homepage in your config.',
				});
			}

			for (const item of buildResult.items) {
				const type = getType(item.type);
				if (type === 'registry:base' || type === 'registry:font') {
					throw new JsrepoError(
						`${item.name} is of type ${type} and cannot be added to the registry.`,
						{
							suggestion: 'Please remove the item from the registry.',
						}
					);
				}
				const parseResult = registryItemFileSchema.shape.type.safeParse(type);
				if (!parseResult.success) {
					throw new JsrepoError(
						`Invalid item type: ${type} for ${
							item.name
						}. Expected one of: ${registryItemFileSchema.shape.type.options.join(', ')}`,
						{
							suggestion:
								'Please use a valid item type or remap the type using the `typeMap` option.',
						}
					);
				}
			}

			const registryJson: Registry & { $schema: string } = {
				$schema: 'https://shadcn-svelte.com/schema/registry.json',
				name: buildResult.name,
				homepage: buildResult.homepage,
				aliases: options.aliases ?? {},
				items: buildResult.items.map((item) => {
					return {
						name: item.name,
						title: item.title,
						description: item.description,
						// validated above
						type: getType(item.type) as Exclude<
							Registry['items'][number]['type'],
							'registry:base' | 'registry:font'
						>,
						// shadcn-svelte doesn't currently support envVars
						// envVars: item.envVars,
						dependencies: item.dependencies?.map(
							(dependency) =>
								`${dependency.name}${dependency.version ? `@${dependency.version}` : ''}`
						),
						registryDependencies: item.registryDependencies ?? [],
						files: item.files.map((file) => {
							const type = getType(file.type);
							if (type === 'registry:page' || type === 'registry:file') {
								if (file.target === undefined) {
									throw new JsrepoError(
										`Target is required for registry items with type ${type}. Please provide a target for ${file.path} on ${item.name}`,
										{
											suggestion: 'Please provide a target for the file.',
										}
									);
								}
							}
							return {
								// biome-ignore lint/suspicious/noExplicitAny: already checked it
								type: type as any,
								path: file.path,
								target: file.target,
							};
						}),
					} satisfies Registry['items'][number];
				}),
			};

			const items: RegistryItem[] = buildResult.items.map((item) => {
				return {
					$schema: 'https://shadcn-svelte.com/schema/registry-item.json',
					name: item.name,
					title: item.title,
					description: item.description,
					type: getType(item.type) as Exclude<
						RegistryItem['type'],
						'registry:base' | 'registry:font'
					>,
					files: item.files.map((file) => {
						return {
							// biome-ignore lint/suspicious/noExplicitAny: already checked it
							type: getType(file.type) as any,
							path: file.path,
							// biome-ignore lint/suspicious/noExplicitAny: types are wrong
							target: file.target as any,
							content: file.content,
						};
					}),
					registryDependencies: item.registryDependencies,
					dependencies: item.dependencies?.map(
						(dependency) =>
							`${dependency.name}${dependency.version ? `@${dependency.version}` : ''}`
					),
				} satisfies RegistryItem;
			});

			// contain errors to this plugin so there aren't issues for users
			const parsedRegistryResult = registrySchema.safeParse(registryJson);
			if (!parsedRegistryResult.success) {
				throw new JsrepoError(
					`Invalid registry ${registryJson.name}: ${parsedRegistryResult.error.message}`,
					{
						suggestion:
							"This one's on us. Please file an issue at https://github.com/jsrepojs/jsrepo/issues",
					}
				);
			}

			for (const item of items) {
				const parsedItemResult = registryItemSchema.safeParse(item);
				if (!parsedItemResult.success) {
					throw new JsrepoError(
						`Invalid item ${item.name}: ${parsedItemResult.error.message}`,
						{
							suggestion:
								"This one's on us. Please file an issue at https://github.com/jsrepojs/jsrepo/issues",
						}
					);
				}
			}

			const tempRegistryJsonPath = path.join(cwd, `registry-temp-${Date.now()}.json`);
			fs.writeFileSync(tempRegistryJsonPath, stringify(registryJson, { format: false }));

			const outDir = path.join(cwd, options.dir);

			// let shadcn-svelte CLI take over

			const pm = await detectPackageManager(cwd);
			const shadcnSvelteCommand = resolveCommand(pm, 'execute', [
				'shadcn-svelte',
				'registry',
				'build',
				tempRegistryJsonPath,
				'--cwd',
				cwd,
				'--output',
				outDir,
			]);

			if (shadcnSvelteCommand === null) {
				throw new JsrepoError('Failed to resolve `shadcn-svelte registry build` command', {
					suggestion: `Please ensure you can build your registry with the \`shadcn-svelte registry build ${tempRegistryJsonPath} --cwd ${cwd} --output ${outDir}\` command.`,
				});
			}

			let failed = false;
			try {
				await x(shadcnSvelteCommand.command, shadcnSvelteCommand.args);
			} catch (err) {
				failed = true;
				throw new JsrepoError(
					`Failed to build registry with shadcn-svelte. Error: ${err instanceof Error ? err.message : String(err)}`,
					{
						suggestion: `Please ensure you can build your registry with the \`shadcn-svelte registry build ${tempRegistryJsonPath} --cwd ${cwd} --output ${outDir}\` command.`,
					}
				);
			} finally {
				if (!failed || cleanOnFailure) {
					// cleanup temp registry json file
					fs.rmSync(tempRegistryJsonPath);
				}
			}
		},
		clean: async ({ cwd }) => {
			const outDir = path.join(cwd, options.dir);
			if (!fs.existsSync(outDir)) return;
			fs.rmSync(path.join(cwd, options.dir), { recursive: true });
		},
	};
}

function stringify(data: unknown, options: { format?: boolean } = {}): string {
	return JSON.stringify(data, null, options.format ? '\t' : undefined);
}
