import * as v from 'valibot';

export const blockSchema = v.object({
	name: v.string(),
	category: v.string(),
	localDependencies: v.array(v.string()),
	dependencies: v.array(v.string()),
	devDependencies: v.array(v.string()),
	tests: v.boolean(),
	list: v.optional(v.boolean(), true),
	/** Where to find the block relative to root */
	directory: v.string(),
	subdirectory: v.boolean(),
	files: v.array(v.string()),
	_imports_: v.record(v.string(), v.string()),
});

export const categorySchema = v.object({
	name: v.string(),
	blocks: v.array(blockSchema),
});

export const manifestMeta = v.object({
	authors: v.optional(v.array(v.string())),
	bugs: v.optional(v.string()),
	description: v.optional(v.string()),
	homepage: v.optional(v.string()),
	repository: v.optional(v.string()),
	tags: v.optional(v.array(v.string())),
});

export const manifestSchema = v.object({
	meta: v.optional(manifestMeta),
	categories: v.array(categorySchema),
});

export type Meta = v.InferOutput<typeof manifestMeta>;

export type Category = v.InferOutput<typeof categorySchema>;

export type Block = v.InferOutput<typeof blockSchema>;

export type Manifest = v.InferOutput<typeof manifestSchema>;
