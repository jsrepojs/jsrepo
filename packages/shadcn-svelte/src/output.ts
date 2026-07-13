import fs from 'node:fs';
import path from 'node:path';
import { detectPackageManager, JsrepoError } from 'jsrepo';
import type { Output } from 'jsrepo/outputs';
import { resolveCommand } from 'package-manager-detector';
import pc from 'picocolors';
import {
	type Registry,
	type RegistryItemType,
	registryItemFileSchema,
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
					const registryDependencies = item.registryDependencies?.map((dep) =>
						toRelativeRegistryDep(dep)
					);
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
						registryDependencies: registryDependencies ?? [],
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
								path: toPosixPath(path.relative(cwd, file.absolutePath)),
								target: file.target
									? toPosixPath(registryInstallTarget(item.name, file.path))
									: undefined,
							};
						}),
					} satisfies Registry['items'][number];
				}),
			};

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
				'--output',
				outDir,
			]);

			if (shadcnSvelteCommand === null) {
				throw new JsrepoError('Failed to resolve `shadcn-svelte registry build` command', {
					suggestion: 'We had trouble resolving the command for you package manager.',
				});
			}

			let failed = false;
			try {
				await x(shadcnSvelteCommand.command, shadcnSvelteCommand.args, {
					nodeOptions: { cwd },
					throwOnError: true,
				});
			} catch (err) {
				failed = true;
				throw new JsrepoError(
					`Failed to build registry with shadcn-svelte. Error: ${err instanceof Error ? err.message : String(err)}`,
					{
						suggestion: `Please ensure you can build your registry with the \`${pc.bold([shadcnSvelteCommand.command, ...shadcnSvelteCommand.args].join(' '))}\` command.`,
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

/** Normalize path segments for POSIX-style registry targets */
function toPosixPath(segment: string) {
	return segment.replaceAll('\\', '/');
}

/**
 * shadcn-svelte registry file `target` must be relative to the item (e.g. `window/window.svelte`),
 * not project alias paths such as `$lib/components/...` that jsrepo uses during builds.
 *
 * {@link https://shadcn-svelte.com/docs/registry/registry-json}
 */
function registryInstallTarget(itemName: string, filePath: string): string {
	const normalized = toPosixPath(filePath);
	if (!normalized.includes('/')) {
		return `${itemName}/${normalized}`;
	}
	const segments = normalized.split('/');
	if (segments[0] === itemName) {
		return normalized;
	}
	return [itemName, ...segments.slice(1)].filter(Boolean).join('/');
}

function toRelativeRegistryDep(dep: string): string {
	if (
		dep.startsWith('http://') ||
		dep.startsWith('https://') ||
		dep.startsWith('./') ||
		dep.startsWith('../')
	) {
		return dep;
	}
	return `./${dep}.json`;
}

function stringify(data: unknown, options: { format?: boolean } = {}): string {
	return JSON.stringify(data, null, options.format ? '\t' : undefined);
}
