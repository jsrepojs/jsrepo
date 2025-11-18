import { z } from 'zod';
import { endsWithOneOf } from '../strings';

export const REGISTRY_CONFIG_FILE_V2 = 'jsrepo-build-config.json';
export const MANIFEST_FILE_V2 = 'jsrepo-manifest.json';
export const PROJECT_CONFIG_FILE_V2 = 'jsrepo.json';

export const ManifestMetaSchemaV2 = z.object({
	authors: z.array(z.string()).optional(),
	bugs: z.string().optional(),
	description: z.string().optional(),
	homepage: z.string().optional(),
	repository: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

export const AccessLevelSchemaV2 = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('marketplace'),
]);

export const ConfigFileSchemaV2 = z.object({
	name: z.string(),
	path: z.string(),
	expectedPath: z.string().optional(),
	optional: z.boolean().optional().default(false),
});

const RuleConfigSchemaV2 = z.record(
	z.string(),
	z.union([
		z.string(),
		z.tuple([z.string(), z.union([z.string(), z.number()])], z.union([z.string(), z.number()])),
	])
);

export const PeerDependencySchemaV2 = z.record(
	z.string(),
	z.union([z.string(), z.object({ version: z.string(), message: z.string() })])
);

export const RegistryConfigSchemaV2 = z.object({
	$schema: z.string(),
	name: z.string().optional(),
	version: z.string().optional(),
	readme: z.string().optional(),
	access: AccessLevelSchemaV2.optional(),
	meta: ManifestMetaSchemaV2.optional(),
	defaultPaths: z.record(z.string(), z.string()).optional(),
	peerDependencies: PeerDependencySchemaV2.optional(),
	configFiles: z.array(ConfigFileSchemaV2).optional(),
	dirs: z.array(z.string()),
	outputDir: z.string().optional(),
	includeBlocks: z.array(z.string()).optional().default([]),
	includeCategories: z.array(z.string()).optional().default([]),
	includeFiles: z.array(z.string()).optional().default([]),
	excludeBlocks: z.array(z.string()).optional().default([]),
	excludeCategories: z.array(z.string()).optional().default([]),
	doNotListBlocks: z.array(z.string()).optional().default([]),
	doNotListCategories: z.array(z.string()).optional().default([]),
	listBlocks: z.array(z.string()).optional().default([]),
	listCategories: z.array(z.string()).optional().default([]),
	excludeDeps: z.array(z.string()).optional().default([]),
	allowSubdirectories: z.boolean().optional(),
	preview: z.boolean().optional(),
	includeDocs: z.boolean().optional().default(false),
	rules: RuleConfigSchemaV2.optional(),
});

export type RegistryConfigV2 = z.infer<typeof RegistryConfigSchemaV2>;

export const ManifestConfigFileSchemaV2 = ConfigFileSchemaV2.extend({
	dependencies: z.array(z.string()).optional(),
	devDependencies: z.array(z.string()).optional(),
});

export const BlockSchemaV2 = z.object({
	name: z.string(),
	category: z.string(),
	localDependencies: z.array(z.string()),
	dependencies: z.array(z.string()),
	devDependencies: z.array(z.string()),
	tests: z.boolean(),
	docs: z.boolean().optional().default(false),
	list: z.boolean().optional().default(true),
	/** Where to find the block relative to root */
	directory: z.string(),
	subdirectory: z.boolean(),
	files: z.array(z.string()),
	_imports_: z.record(z.string(), z.string()),
});

export const CategorySchemaV2 = z.object({
	name: z.string(),
	blocks: z.array(BlockSchemaV2),
});

export const ManifestSchemaV2 = z.object({
	name: z.string().optional(),
	version: z.string().optional(),
	meta: ManifestMetaSchemaV2.optional(),
	access: AccessLevelSchemaV2.optional(),
	defaultPaths: z.record(z.string(), z.string()).optional(),
	configFiles: z.array(ManifestConfigFileSchemaV2).optional(),
	categories: z.array(CategorySchemaV2),
});

export const FormatterSchemaV2 = z.union([z.literal('prettier'), z.literal('biome')]);

export const ProjectConfigSchemaV2 = z.object({
	$schema: z.string(),
	repos: z.array(z.string()).optional().default([]),
	includeTests: z.boolean().optional().default(false),
	includeDocs: z.boolean().optional().default(false),
	paths: z.record(z.string(), z.string()).optional(),
	configFiles: z.record(z.string(), z.string()).optional(),
	watermark: z.optional(z.boolean()).default(true),
	formatter: z.optional(FormatterSchemaV2),
});

export type ProjectConfigV2 = z.infer<typeof ProjectConfigSchemaV2>;

const TEST_SUFFIXES = [
	'.test.ts',
	'_test.ts',
	'.test.js',
	'_test.js',
	'.spec.ts',
	'_spec.ts',
	'.spec.js',
	'_spec.js',
	'.stories.jsx',
	'_stories.jsx',
	'.stories.tsx',
	'_stories.tsx',
] as const;

const DOCS_SUFFIXES = ['.mdx', '.md'] as const;

export function isTestFile(file: string): boolean {
	return endsWithOneOf(file, TEST_SUFFIXES) !== undefined;
}

export function isDocsFile(file: string): boolean {
	return endsWithOneOf(file, DOCS_SUFFIXES) !== undefined;
}
