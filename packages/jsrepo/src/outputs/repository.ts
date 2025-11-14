import { z } from 'zod';
import { type Output, RegistryPluginsSchema, RemoteDependencySchema } from '@/outputs/types';
import { MANIFEST_FILE } from '@/utils/build';
import { RegistryFileRoles, RegistryItemAddSchema, RegistryMetaSchema } from '@/utils/config';
import { rmSync, writeFileSync } from '@/utils/fs';
import { stringify } from '@/utils/json';
import { joinAbsolute, type RelativeToCwdPath, relativeToCwd } from '@/utils/path';
import type { ItemRelativePath } from '@/utils/types';

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
	type: z.union([z.string(), z.undefined()]),
	role: z.union([z.union(RegistryFileRoles.map((role) => z.literal(role))), z.undefined()]),
	relativePath: z.string().transform((v) => v as RelativeToCwdPath),
	_imports_: z
		.union([
			z.array(
				z.object({
					import: z.string(),
					item: z.string(),
					meta: z.record(z.string(), z.unknown()),
				})
			),
			z.undefined(),
		])
		.default([]),
	target: z.union([z.string(), z.undefined()]),
	registryDependencies: z.union([z.array(z.string()), z.undefined()]),
	dependencies: z.union([z.array(RemoteDependencySchema), z.undefined()]),
	devDependencies: z.union([z.array(RemoteDependencySchema), z.undefined()]),
});

export type RepositoryOutputFile = z.infer<typeof RepositoryOutputFileSchema>;

export const RepositoryOutputManifestItemSchema = z.object({
	name: z.string(),
	title: z.union([z.string(), z.undefined()]),
	description: z.union([z.string(), z.undefined()]),
	type: z.string(),
	registryDependencies: z.union([z.array(z.string()), z.undefined()]),
	add: z.union([RegistryItemAddSchema, z.undefined()]),
	files: z.union([z.array(RepositoryOutputFileSchema), z.undefined()]).default([]),
	dependencies: z.union([z.array(z.union([RemoteDependencySchema, z.string()])), z.undefined()]),
	devDependencies: z.union([
		z.array(z.union([RemoteDependencySchema, z.string()])),
		z.undefined(),
	]),
	envVars: z.union([z.record(z.string(), z.string()), z.undefined()]),
});

export type RepositoryOutputManifestItem = z.infer<typeof RepositoryOutputManifestItemSchema>;

export const RepositoryOutputManifestSchema = RegistryMetaSchema.extend({
	type: z.literal('repository'),
	plugins: z.union([RegistryPluginsSchema, z.undefined()]),
	items: z.array(RepositoryOutputManifestItemSchema),
	defaultPaths: z.union([z.record(z.string(), z.string()), z.undefined()]),
});

export type RepositoryOutputManifest = z.infer<typeof RepositoryOutputManifestSchema>;
