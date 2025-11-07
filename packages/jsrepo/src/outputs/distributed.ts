import fs from 'node:fs';
import path from 'pathe';
import { z } from 'zod';
import { type Output, RegistryPluginsSchema } from '@/outputs/types';
import { MANIFEST_FILE } from '@/utils/build';
import { RegistryMetaSchema } from '@/utils/config';
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
			const files: { path: string; contents: string }[] = [];
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
					description: item.description,
					type: item.type,
					add: item.add,
					registryDependencies: item.registryDependencies,
					dependencies: item.dependencies,
					envVars: item.envVars,
					files: item.files.map((file) => ({
						type: file.type,
						path: path.relative(
							path.join(cwd, item.basePath),
							path.join(cwd, file.path)
						),
						target: file.target,
					})),
				})),
			};
			files.push({
				path: path.join(cwd, dir, MANIFEST_FILE),
				contents: stringify(manifest, { format }),
			});

			for (const item of buildResult.items) {
				const outputItem: DistributedOutputItem = {
					name: item.name,
					description: item.description,
					type: item.type,
					add: item.add,
					files: item.files.map((file) => ({
						type: file.type,
						contents: file.contents,
						path: path.relative(
							path.join(cwd, item.basePath),
							path.join(cwd, file.path)
						),
						_imports_: file._imports_,
						target: file.target,
					})),
					registryDependencies: item.registryDependencies,
					dependencies: item.dependencies,
					envVars: item.envVars,
				};
				files.push({
					path: path.join(cwd, dir, `${item.name}.json`),
					contents: stringify(outputItem, { format }),
				});
			}

			for (const file of files) {
				if (!fs.existsSync(path.dirname(file.path))) {
					fs.mkdirSync(path.dirname(file.path), { recursive: true });
				}
				fs.writeFileSync(file.path, file.contents);
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
	type: z.string().optional(),
	target: z.string().optional(),
});

export type DistributedOutputManifestFile = z.infer<typeof DistributedOutputManifestFileSchema>;

export const DistributedOutputManifestItemSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	type: z.string(),
	registryDependencies: z.array(z.string()).optional(),
	add: z.enum(['on-init', 'when-needed', 'when-added']).optional(),
	dependencies: z
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
	files: z.array(DistributedOutputManifestFileSchema).optional().default([]),
});

export const DistributedOutputManifestSchema = RegistryMetaSchema.extend({
	type: z.literal('distributed').optional().default('distributed'),
	plugins: RegistryPluginsSchema.optional(),
	items: z.array(DistributedOutputManifestItemSchema),
	defaultPaths: z.record(z.string(), z.string()).optional(),
});

export type DistributedOutputManifest = z.infer<typeof DistributedOutputManifestSchema>;

export const DistributedOutputFileSchema = z.object({
	path: z.string(),
	contents: z.string(),
	type: z.string().optional(),
	_imports_: z.array(
		z.object({
			import: z.string(),
			item: z.string(),
			meta: z.record(z.string(), z.unknown()),
		})
	),
	target: z.string().optional(),
});

export const DistributedOutputItemSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	type: z.string(),
	registryDependencies: z.array(z.string()).optional(),
	add: z.enum(['on-init', 'when-needed', 'when-added']).optional(),
	dependencies: z
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
	files: z.array(DistributedOutputFileSchema).optional().default([]),
});

export type DistributedOutputItem = z.infer<typeof DistributedOutputItemSchema>;
