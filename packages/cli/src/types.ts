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

export type Category = v.InferOutput<typeof categorySchema>;

export type Block = v.InferOutput<typeof blockSchema>;

export type Manifest = Category[];
