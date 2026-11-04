import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registryIndexSchema, registryItemSchema } from 'shadcn-svelte/schema';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Builds the fixture registry with jsrepo (using this output) and again with the real
 * `shadcn-svelte registry build` command and makes sure the results are interchangeable.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(dirname, 'fixtures', 'registry');
const outputDir = path.join(fixture, '.output');
const jsrepoOut = path.join(outputDir, 'jsrepo');
const cliOut = path.join(outputDir, 'cli');

const require = createRequire(import.meta.url);
const jsrepoBin = path.join(dirname, '..', 'node_modules', 'jsrepo', 'dist', 'bin.mjs');
// the schema is exported from `dist/schema/index.mjs` and the CLI lives at `dist/index.mjs`
const shadcnSvelteBin = path.join(
	path.dirname(require.resolve('shadcn-svelte/schema')),
	'..',
	'index.mjs'
);

type Item = {
	name: string;
	registryDependencies?: string[];
	files: { content: string; type: string; target: string }[];
	[key: string]: unknown;
};

function readJson<T = Item>(...segments: string[]): T {
	return JSON.parse(fs.readFileSync(path.join(...segments), 'utf-8')) as T;
}

/** Order doesn't matter for dependencies or files so we don't want the tests to care about it. */
function normalize(item: Item): Item {
	return {
		...item,
		registryDependencies: item.registryDependencies?.toSorted(),
		files: item.files.toSorted((a, b) => a.target.localeCompare(b.target)),
	};
}

describe('shadcn-svelte output', () => {
	beforeAll(() => {
		fs.rmSync(outputDir, { recursive: true, force: true });

		execFileSync('node', [jsrepoBin, 'build', '--cwd', fixture], { stdio: 'pipe' });
		// the CLI reads the files relative to the process cwd and not the `--cwd` flag
		execFileSync(
			'node',
			[shadcnSvelteBin, 'registry', 'build', './registry.json', '--output', cliOut],
			{ cwd: fixture, stdio: 'pipe' }
		);
	}, 60_000);

	afterAll(() => {
		fs.rmSync(outputDir, { recursive: true, force: true });
	});

	it('should output the same items as the shadcn-svelte CLI', () => {
		const expected = fs.readdirSync(cliOut).filter((file) => file !== 'index.json');
		const actual = fs.readdirSync(jsrepoOut);

		// the CLI doesn't know about everything that jsrepo supports so there are a few extra items
		expect(actual).toEqual(expect.arrayContaining(expected));

		for (const file of expected) {
			expect(normalize(readJson(jsrepoOut, file)), file).toStrictEqual(
				normalize(readJson(cliOut, file))
			);
		}
	});

	it('should output an index equivalent to the one from the shadcn-svelte CLI', () => {
		// the CLI echoes the registry.json it was given while jsrepo resolves everything for you
		const project = (entry: Record<string, unknown>) => ({
			name: entry.name,
			title: entry.title,
			type: entry.type,
			description: entry.description,
			relativeUrl: entry.relativeUrl,
		});

		const expected = readJson<Record<string, unknown>[]>(cliOut, 'index.json').map(project);
		const actual = readJson<Record<string, unknown>[]>(jsrepoOut, 'index.json').map(project);

		expect(actual).toEqual(expect.arrayContaining(expected));
	});

	it('should output valid shadcn-svelte registry items and index', () => {
		for (const file of fs.readdirSync(jsrepoOut)) {
			const json = readJson<unknown>(jsrepoOut, file);
			const result =
				file === 'index.json'
					? registryIndexSchema.safeParse(json)
					: registryItemSchema.safeParse(json);
			expect(result.success, file).toBe(true);
		}
	});

	it('should replace the registry aliases with the shadcn-svelte placeholders', () => {
		const widget = readJson(jsrepoOut, 'widget.json');
		const content = widget.files.find(
			(file) => file.target === 'widget/widget.svelte'
		)?.content;

		expect(content).toContain("from '$UTILS$.js'");
		expect(content).toContain("from '$HOOKS$/use-counter.svelte.js'");
		expect(content).not.toContain('$lib');

		const card = readJson(jsrepoOut, 'card.json');
		expect(card.files[0]?.content).toContain("from '$COMPONENTS$/ui/widget/index.js'");
	});

	it('should not include example or test files', () => {
		const widget = readJson(jsrepoOut, 'widget.json');
		expect(widget.files.map((file) => file.target).toSorted()).toStrictEqual([
			'widget/index.ts',
			'widget/widget-label.svelte',
			'widget/widget.svelte',
		]);

		const card = readJson(jsrepoOut, 'card.json');
		expect(card.files.map((file) => file.target)).toStrictEqual(['card.svelte']);
	});

	it('should preserve targets for registry:file and registry:page', () => {
		expect(readJson(jsrepoOut, 'env-example.json').files[0]?.target).toBe('~/.env.example');
		expect(readJson(jsrepoOut, 'demo-page.json').files[0]?.target).toBe('demo/+page.svelte');
	});

	it('should resolve dependencies between items as relative urls', () => {
		expect(readJson(jsrepoOut, 'widget.json').registryDependencies?.toSorted()).toStrictEqual([
			'./use-counter.json',
			'./utils.json',
		]);
	});

	it('should apply jsrepo transforms to the content', () => {
		// the shadcn-svelte CLI reads files from disk so it can never see transformed content
		const banner = readJson(jsrepoOut, 'banner.json');
		expect(banner.files[0]?.content).not.toContain('@fixture-header');
		expect(banner.files[0]?.content.startsWith('<script lang="ts">')).toBe(true);
	});

	it('should make explicit targets relative to the alias for their type', () => {
		expect(readJson(jsrepoOut, 'banner.json').files[0]?.target).toBe('fancy/banner.svelte');
	});

	it('should include remote dependencies', () => {
		expect(readJson(jsrepoOut, 'utils.json').dependencies).toStrictEqual(['clsx@^2.1.1']);
	});
});
