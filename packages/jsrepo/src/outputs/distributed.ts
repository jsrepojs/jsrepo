import { z } from 'zod';
import { type Output, RegistryPluginsSchema, RemoteDependencySchema } from '@/outputs/types';
import { MANIFEST_FILE, UnresolvedImportSchema } from '@/utils/build';
import { RegistryItemAddSchema, RegistryMetaSchema } from '@/utils/config';
import { existsSync, readFileSync, rmSync, writeFileSync } from '@/utils/fs';
import { stringify } from '@/utils/json';
import { joinAbsolute } from '@/utils/path';
import type { AbsolutePath, ItemRelativePath } from '@/utils/types';
import { safeParseFromJSON } from '@/utils/zod';

export type DistributedOutputOptions = {
	/** The directory to output the files to */
	dir: string;
	/** Whether or not to format the output. @default false */
	format?: boolean;
};

/**
 * Use this output type when you are going to serve your registry as a static asset.
 *
 * ```ts
 * import { distributed } from "jsrepo/outputs";
 *
 * export default defineConfig({
 *   // ...
 *   outputs: [distributed({ dir: "./public/r" })]
 * });
 * ```
 *
 * This will create a file structure like:
 * ```plaintext
 * 📁 public/r
 * ├── registry.json
 * ├── button.json
 * └── math.json
 * ```
 * @param options
 * @returns
 */
export function distributed({ dir, format }: DistributedOutputOptions): Output {
	return {
		output: async (buildResult, { cwd }) => {
			const files: { path: AbsolutePath; content: string }[] = [];
			const manifest: DistributedOutputManifest = {
				name: buildResult.name,
				authors: buildResult.authors,
				bugs: buildResult.bugs,
				description: buildResult.description,
				homepage: buildResult.homepage,
				repository: buildResult.repository,
				tags: buildResult.tags,
				version: buildResult.version,
				meta: buildResult.meta,
				type: 'distributed',
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
					envVars: item.envVars,
					files: item.files.map(
						(file) =>
							({
								type: file.type,
								role: file.role,
								path: file.path,
								target: file.target,
								registryDependencies: file.registryDependencies,
								dependencies: file.dependencies,
								devDependencies: file.devDependencies,
							}) satisfies DistributedOutputManifestFile
					),
					categories: item.categories,
					meta: item.meta,
				})),
			};
			files.push({
				path: joinAbsolute(cwd, dir, MANIFEST_FILE),
				content: stringify(manifest, { format }),
			});

			for (const item of buildResult.items) {
				const outputItem: DistributedOutputItem = {
					name: item.name,
					title: item.title,
					description: item.description,
					type: item.type,
					add: item.add,
					files: item.files.map(
						(file) =>
							({
								type: file.type,
								role: file.role,
								content: file.content,
								path: file.path,
								_imports_: file._imports_,
								target: file.target,
								registryDependencies: file.registryDependencies,
								dependencies: file.dependencies,
								devDependencies: file.devDependencies,
							}) satisfies DistributedOutputFile
					),
					registryDependencies: item.registryDependencies,
					dependencies: item.dependencies,
					devDependencies: item.devDependencies,
					envVars: item.envVars,
					categories: item.categories,
					meta: item.meta,
				};
				files.push({
					path: joinAbsolute(cwd, dir, `${item.name}.json`),
					content: stringify(outputItem, { format }),
				});
			}

			for (const file of files) {
				writeFileSync(file.path, file.content);
			}
		},
		clean: async ({ cwd }) => {
			const manifestPath = joinAbsolute(cwd, dir, MANIFEST_FILE);
			if (!existsSync(manifestPath)) return;
			const contentsResult = readFileSync(manifestPath as AbsolutePath);
			if (contentsResult.isErr()) return;
			const contents = contentsResult.value;
			const manifestResult = safeParseFromJSON(DistributedOutputManifestSchema, contents);
			if (manifestResult.isErr()) return;
			const manifest = manifestResult.value;
			for (const item of manifest.items) {
				const itemPath = joinAbsolute(cwd, dir, `${item.name}.json`);
				rmSync(itemPath);
			}
			rmSync(manifestPath);
		},
	};
}

export const DistributedOutputManifestFileSchema = z.object({
	path: z.string().transform((v) => v as ItemRelativePath),
	type: z.string(),
	role: z.string().optional(),
	target: z.union([z.string(), z.undefined()]),
	registryDependencies: z.union([z.array(z.string()), z.undefined()]),
	dependencies: z.union([z.array(RemoteDependencySchema), z.undefined()]),
	devDependencies: z.union([z.array(RemoteDependencySchema), z.undefined()]),
});

export type DistributedOutputManifestFile = z.infer<typeof DistributedOutputManifestFileSchema>;

export const DistributedOutputManifestItemSchema = z.object({
	name: z.string(),
	title: z.union([z.string(), z.undefined()]),
	description: z.union([z.string(), z.undefined()]),
	type: z.string(),
	registryDependencies: z.union([z.array(z.string()), z.undefined()]),
	add: z.union([RegistryItemAddSchema, z.undefined()]),
	dependencies: z.union([z.array(z.union([RemoteDependencySchema, z.string()])), z.undefined()]),
	devDependencies: z.union([
		z.array(z.union([RemoteDependencySchema, z.string()])),
		z.undefined(),
	]),
	envVars: z.union([z.record(z.string(), z.string()), z.undefined()]),
	files: z.union([z.array(DistributedOutputManifestFileSchema), z.undefined()]).default([]),
	categories: z.union([z.array(z.string()), z.undefined()]),
	meta: z.union([z.record(z.string(), z.string()), z.undefined()]),
});

export const DistributedOutputManifestSchema = RegistryMetaSchema.extend({
	type: z.union([z.literal('distributed'), z.undefined()]).default('distributed'),
	plugins: z.union([RegistryPluginsSchema, z.undefined()]),
	items: z.array(DistributedOutputManifestItemSchema),
	defaultPaths: z.union([z.record(z.string(), z.string()), z.undefined()]),
});

export type DistributedOutputManifest = z.infer<typeof DistributedOutputManifestSchema>;

export const DistributedOutputFileSchema = z.object({
	path: z.string().transform((v) => v as ItemRelativePath),
	content: z.string(),
	type: z.string(),
	role: z.string().optional(),
	_imports_: z.union([z.array(UnresolvedImportSchema), z.undefined()]),
	target: z.union([z.string(), z.undefined()]),
	registryDependencies: z.union([z.array(z.string()), z.undefined()]),
	dependencies: z.union([z.array(RemoteDependencySchema), z.undefined()]),
	devDependencies: z.union([z.array(RemoteDependencySchema), z.undefined()]),
});

export type DistributedOutputFile = z.infer<typeof DistributedOutputFileSchema>;

export const DistributedOutputItemSchema = z.object({
	$schema: z.string().optional(),
	name: z.string(),
	title: z.union([z.string(), z.undefined()]),
	description: z.union([z.string(), z.undefined()]),
	type: z.string(),
	registryDependencies: z.union([z.array(z.string()), z.undefined()]),
	add: z.union([RegistryItemAddSchema, z.undefined()]),
	dependencies: z.union([z.array(z.union([RemoteDependencySchema, z.string()])), z.undefined()]),
	devDependencies: z.union([
		z.array(z.union([RemoteDependencySchema, z.string()])),
		z.undefined(),
	]),
	envVars: z.union([z.record(z.string(), z.string()), z.undefined()]),
	files: z.union([z.array(DistributedOutputFileSchema), z.undefined()]).default([]),
	categories: z.union([z.array(z.string()), z.undefined()]),
	meta: z.union([z.record(z.string(), z.string()), z.undefined()]),
});

export type DistributedOutputItem = z.infer<typeof DistributedOutputItemSchema>;
