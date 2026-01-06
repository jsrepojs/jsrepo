import fs from 'node:fs';
import path from 'node:path';
import { JsrepoError } from 'jsrepo';
import type { Output } from 'jsrepo/outputs';
import {
	type Registry,
	type RegistryItem,
	registryItemSchema,
	registryItemTypeSchema,
	registrySchema,
} from 'shadcn/schema';

export type OutputOptions = {
	format?: boolean;
	dir: string;
};

export function output(options: OutputOptions): Output {
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
				const parseResult = registryItemTypeSchema.safeParse(type);
				if (!parseResult.success) {
					throw new JsrepoError(
						`Invalid item type: ${type} for ${
							item.name
						}. Expected one of: ${registryItemTypeSchema.options.join(', ')}`,
						{
							suggestion: 'Please use a valid item type.',
						}
					);
				}
			}

			const registryJson: Registry & { $schema: string } = {
				$schema: 'https://ui.shadcn.com/schema/registry.json',
				name: buildResult.name,
				homepage: buildResult.homepage,
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
						envVars: item.envVars,
						dependencies: item.dependencies?.map(
							(dependency) =>
								`${dependency.name}${dependency.version ? `@${dependency.version}` : ''}`
						),
						registryDependencies: item.registryDependencies,
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
					$schema: 'https://ui.shadcn.com/schema/registry-item.json',
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
							target: file.target,
							content: file.content,
						};
					}),
					envVars: item.envVars,
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

			const outDir = path.join(cwd, options.dir);
			if (!fs.existsSync(outDir)) {
				fs.mkdirSync(outDir, { recursive: true });
			}

			fs.writeFileSync(
				path.join(outDir, 'registry.json'),
				stringify(registryJson, { format: options.format })
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
			fs.rmSync(path.join(cwd, options.dir), { recursive: true });
		},
	};
}

function getType(type?: string) {
	// this way we don't require target by default
	if (!type) return 'registry:ui';
	return type.startsWith('registry:') ? type : `registry:${type}`;
}

function stringify(data: unknown, options: { format?: boolean } = {}): string {
	return JSON.stringify(data, null, options.format ? '\t' : undefined);
}
