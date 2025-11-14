import fs from 'node:fs';
import path from 'pathe';
import { z } from 'zod';
import { type Output, RegistryPluginsSchema, RemoteDependencySchema } from '@/outputs/types';
import { MANIFEST_FILE } from '@/utils/build';
import { RegistryItemAddSchema, RegistryMetaSchema } from '@/utils/config';
import { stringify } from '@/utils/json';
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
			const files: { path: string; content: string }[] = [];
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
								path: file.path,
								target: file.target,
								registryDependencies: file.registryDependencies,
								dependencies: file.dependencies,
								devDependencies: file.devDependencies,
							}) satisfies DistributedOutputManifestFile
					),
				})),
			};
			files.push({
				path: path.join(cwd, dir, MANIFEST_FILE),
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
				};
				files.push({
					path: path.join(cwd, dir, `${item.name}.json`),
					content: stringify(outputItem, { format }),
				});
			}

			for (const file of files) {
				if (!fs.existsSync(path.dirname(file.path))) {
					fs.mkdirSync(path.dirname(file.path), { recursive: true });
				}
				fs.writeFileSync(file.path, file.content);
			}
		},
		clean: async ({ cwd }) => {
			const manifestPath = path.join(cwd, dir, MANIFEST_FILE);
			if (!fs.existsSync(manifestPath)) return;
			const manifestResult = safeParseFromJSON(
				DistributedOutputManifestSchema,
				fs.readFileSync(manifestPath, 'utf-8')
			);
			if (manifestResult.isErr()) return;
			const manifest = manifestResult.value;
			for (const item of manifest.items) {
				const itemPath = path.join(cwd, dir, `${item.name}.json`);
				if (fs.existsSync(itemPath)) fs.rmSync(itemPath);
			}
			fs.rmSync(manifestPath);
		},
	};
}

export const DistributedOutputManifestFileSchema = z.object({
	path: z.string(),
	type: z.union([z.string(), z.undefined()]),
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
});

export const DistributedOutputManifestSchema = RegistryMetaSchema.extend({
	type: z.union([z.literal('distributed'), z.undefined()]).default('distributed'),
	plugins: z.union([RegistryPluginsSchema, z.undefined()]),
	items: z.array(DistributedOutputManifestItemSchema),
	defaultPaths: z.union([z.record(z.string(), z.string()), z.undefined()]),
});

export type DistributedOutputManifest = z.infer<typeof DistributedOutputManifestSchema>;

export const DistributedOutputFileSchema = z.object({
	path: z.string(),
	content: z.string(),
	type: z.union([z.string(), z.undefined()]),
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

export type DistributedOutputFile = z.infer<typeof DistributedOutputFileSchema>;

export const DistributedOutputItemSchema = z.object({
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
});

export type DistributedOutputItem = z.infer<typeof DistributedOutputItemSchema>;
