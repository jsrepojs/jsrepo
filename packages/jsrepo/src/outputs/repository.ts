import { z } from 'zod';
import { type Output, RegistryPluginsSchema, RemoteDependencySchema } from '@/outputs/types';
import { MANIFEST_FILE, UnresolvedImportSchema } from '@/utils/build';
import { RegistryItemAddSchema, RegistryMetaSchema } from '@/utils/config';
import { rmSync, writeFileSync } from '@/utils/fs';
import { type StringifyFormat, stringify } from '@/utils/json';
import { joinAbsolute, type RelativeToCwdPath, relativeToCwd } from '@/utils/path';
import type { ItemRelativePath } from '@/utils/types';
import { valueOptional } from '@/utils/zod';

export type RepositoryOutputOptions = {
	/** Whether or not to format the output. @default false */
	format?: StringifyFormat;
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
					title: item.title,
					description: item.description,
					type: item.type,
					add: item.add,
					registryDependencies: item.registryDependencies,
					dependencies: item.dependencies,
					devDependencies: item.devDependencies,
					files: item.files.map(
						(file) =>
							({
								type: file.type,
								role: file.role,
								path: file.path,
								relativePath: relativeToCwd(cwd, file.absolutePath),
								_imports_: file._imports_,
								target: file.target,
								registryDependencies: file.registryDependencies,
								dependencies: file.dependencies,
								devDependencies: file.devDependencies,
							}) satisfies RepositoryOutputFile
					),
					envVars: item.envVars,
					categories: item.categories,
					meta: item.meta,
				})),
			};

			writeFileSync(joinAbsolute(cwd, MANIFEST_FILE), stringify(manifest, { format }));
		},
		clean: async ({ cwd }) => {
			rmSync(joinAbsolute(cwd, MANIFEST_FILE));
		},
	};
}

export const RepositoryOutputFileSchema = z.object({
	path: z.string().transform((v) => v as ItemRelativePath),
	type: z.string(),
	role: z.string().optional(),
	relativePath: z.string().transform((v) => v as RelativeToCwdPath),
	_imports_: z.array(UnresolvedImportSchema),
	target: valueOptional(z.string()),
	registryDependencies: valueOptional(z.array(z.string())),
	dependencies: valueOptional(z.array(RemoteDependencySchema)),
	devDependencies: valueOptional(z.array(RemoteDependencySchema)),
});

export type RepositoryOutputFile = z.infer<typeof RepositoryOutputFileSchema>;

export const RepositoryOutputManifestItemSchema = z.object({
	name: z.string(),
	title: valueOptional(z.string()),
	description: valueOptional(z.string()),
	type: z.string(),
	registryDependencies: valueOptional(z.array(z.string())),
	add: valueOptional(RegistryItemAddSchema),
	files: z.union([z.array(RepositoryOutputFileSchema), z.undefined()]).default([]),
	dependencies: valueOptional(z.array(z.union([RemoteDependencySchema, z.string()]))),
	devDependencies: valueOptional(z.array(z.union([RemoteDependencySchema, z.string()]))),
	envVars: valueOptional(z.record(z.string(), z.string())),
	categories: valueOptional(z.array(z.string())),
	meta: valueOptional(z.record(z.string(), z.string())),
});

export type RepositoryOutputManifestItem = z.infer<typeof RepositoryOutputManifestItemSchema>;

export const RepositoryOutputManifestSchema = RegistryMetaSchema.extend({
	type: z.literal('repository'),
	plugins: valueOptional(RegistryPluginsSchema),
	items: z.array(RepositoryOutputManifestItemSchema),
	defaultPaths: valueOptional(z.record(z.string(), z.string())),
});

export type RepositoryOutputManifest = z.infer<typeof RepositoryOutputManifestSchema>;
