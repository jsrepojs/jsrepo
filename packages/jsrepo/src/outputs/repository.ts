import fs from 'node:fs';
import path from 'pathe';
import { z } from 'zod';
import { type Output, RegistryPluginsSchema } from '@/outputs/types';
import { MANIFEST_FILE } from '@/utils/build';
import { RegistryItemAddSchema, RegistryMetaSchema } from '@/utils/config';
import { stringify } from '@/utils/json';

export type RepositoryOutputOptions = {
	/** Whether or not to format the output. @default false */
	format?: boolean;
};

/**
 * Use this output type when you are serving your registry from a repository.
 *
 * ```ts
 * import { repository } from "jsrepo/outputs";
 *
 * export default defineConfig({
 *   // ...
 *   outputs: [repository()]
 * });
 * ```
 *
 * This will create a manifest file at the root of your repository like:
 * ```plaintext
 * 📁 .
 * └── registry.json
 * ```
 * @param options
 * @returns
 */
export function repository({ format }: RepositoryOutputOptions = {}): Output {
	return {
		output: async (buildResult, { cwd }) => {
			const manifest: RepositoryOutputManifest = {
				name: buildResult.name,
				authors: buildResult.authors,
				bugs: buildResult.bugs,
				description: buildResult.description,
				homepage: buildResult.homepage,
				repository: buildResult.repository,
				tags: buildResult.tags,
				version: buildResult.version,
				meta: buildResult.meta,
				type: 'repository',
				plugins: buildResult.plugins,
				defaultPaths: buildResult.defaultPaths,
				items: buildResult.items.map((item) => ({
					name: item.name,
					description: item.description,
					type: item.type,
					add: item.add,
					registryDependencies: item.registryDependencies,
					dependencies: item.dependencies,
					devDependencies: item.devDependencies,
					files: item.files.map((file) => ({
						type: file.type,
						path: file.path,
						relativePath: path.relative(
							path.join(cwd, item.basePath),
							path.join(cwd, file.path)
						),
						_imports_: file._imports_,
						target: file.target,
					})),
					envVars: item.envVars,
				})),
			};

			fs.writeFileSync(path.join(cwd, MANIFEST_FILE), stringify(manifest, { format }));
		},
		clean: async ({ cwd }) => {
			const manifestPath = path.join(cwd, MANIFEST_FILE);
			if (!fs.existsSync(manifestPath)) return;
			fs.rmSync(manifestPath);
		},
	};
}

export const RepositoryOutputFileSchema = z.object({
	path: z.string(),
	type: z.string().optional(),
	relativePath: z.string(),
	_imports_: z
		.array(
			z.object({
				import: z.string(),
				item: z.string(),
				meta: z.record(z.string(), z.unknown()),
			})
		)
		.optional()
		.default([]),
	target: z.string().optional(),
});

export type RepositoryOutputFile = z.infer<typeof RepositoryOutputFileSchema>;

export const RepositoryOutputManifestItemSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	type: z.string(),
	registryDependencies: z.array(z.string()).optional(),
	add: RegistryItemAddSchema.optional(),
	files: z.array(RepositoryOutputFileSchema).optional().default([]),
	dependencies: z
		.array(
			z.object({
				ecosystem: z.string(),
				name: z.string(),
				version: z.string().optional(),
			})
		)
		.optional(),
	devDependencies: z
		.array(
			z.union([
				z.object({
					ecosystem: z.string(),
					name: z.string(),
					version: z.string().optional(),
				}),
				z.string(),
			])
		)
		.optional(),
	envVars: z.record(z.string(), z.string()).optional(),
});

export type RepositoryOutputManifestItem = z.infer<typeof RepositoryOutputManifestItemSchema>;

export const RepositoryOutputManifestSchema = RegistryMetaSchema.extend({
	type: z.literal('repository'),
	plugins: RegistryPluginsSchema.optional(),
	items: z.array(RepositoryOutputManifestItemSchema),
	defaultPaths: z.record(z.string(), z.string()).optional(),
});

export type RepositoryOutputManifest = z.infer<typeof RepositoryOutputManifestSchema>;
