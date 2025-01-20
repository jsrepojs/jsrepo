import fs from 'node:fs';
import color from 'chalk';
import { program } from 'commander';
import type { Ignore } from 'ignore';
import path from 'pathe';
import * as v from 'valibot';
import * as ascii from '../ascii';
import type { RegistryConfig } from '../config';
import { languages } from '../language-support';
import { isDependedOn } from './check';

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

const TEST_SUFFIXES = ['.test.ts', '_test.ts', '.test.js', '_test.js'] as const;

const isTestFile = (file: string): boolean =>
	TEST_SUFFIXES.find((suffix) => file.endsWith(suffix)) !== undefined;

type Options = {
	cwd: string;
	ignore: Ignore;
	config: RegistryConfig;
};

/** Using the provided path to the blocks folder builds the blocks into categories and also resolves dependencies
 *
 * @param blocksPath
 * @returns
 */
const buildBlocksDirectory = (
	blocksPath: string,
	{
		cwd,
		ignore,
		config: {
			excludeDeps,
			includeBlocks,
			includeCategories,
			excludeBlocks,
			excludeCategories,
			dirs,
			doNotListBlocks,
			doNotListCategories,
			listBlocks,
			listCategories,
		},
	}: Options
): Category[] => {
	let paths: string[];

	try {
		paths = fs.readdirSync(blocksPath);
	} catch {
		program.error(color.red(`Couldn't read the ${color.bold(blocksPath)} directory.`));
	}

	const categories: Category[] = [];

	for (const categoryPath of paths) {
		const categoryDir = path.join(blocksPath, categoryPath);

		const stat = fs.statSync(categoryDir);

		if (stat.isFile()) continue;

		// we append a '/' to tell ignore that this is a directory not a file
		const ignorable = `${path.relative(cwd, categoryDir)}/`;

		if (ignore.ignores(ignorable)) continue;

		const categoryName = path.basename(categoryPath);

		// if excludeCategories enabled and category is part of excludeCategories
		if (
			excludeCategories.length > 0 &&
			excludeCategories.find((val) => val.trim() === categoryName.trim())
		)
			continue;

		// if includeCategories enabled and category is not part of includeCategories skip adding it
		if (
			includeCategories.length > 0 &&
			!includeCategories.find((val) => val.trim() === categoryName.trim())
		)
			continue;

		let shouldListCategory = true;

		if (doNotListCategories.includes(categoryName)) {
			shouldListCategory = false;
		}

		if (listCategories.length > 0 && !listCategories.includes(categoryName)) {
			shouldListCategory = false;
		}

		const category: Category = {
			name: categoryName,
			blocks: [],
		};

		const files = fs.readdirSync(categoryDir);

		for (const file of files) {
			const blockDir = path.join(categoryDir, file);

			if (fs.statSync(blockDir).isFile()) {
				if (isTestFile(file)) continue;

				const name = transformBlockName(file);

				let shouldListBlock = true;

				if (doNotListBlocks.includes(name)) {
					shouldListBlock = false;
				}

				if (listBlocks.length > 0 && !listBlocks.includes(name)) {
					shouldListBlock = false;
				}

				// if excludeBlocks enabled and block is part of excludeBlocks skip adding it
				if (
					excludeBlocks.length > 0 &&
					excludeBlocks.find((val) => val.trim() === name.trim())
				)
					continue;

				// if includeBlocks enabled and block is not part of includeBlocks skip adding it
				if (
					includeBlocks.length > 0 &&
					!includeBlocks.find((val) => val.trim() === name.trim())
				)
					continue;

				const lang = languages.find((resolver) => resolver.matches(file));

				if (!lang) {
					const error = 'files are not currently supported!';

					console.warn(
						`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped \`${color.bold(blockDir)}\` \`*${color.bold(
							path.parse(file).ext
						)}\` ${error}`
					);

					continue;
				}

				// tries to find a test file with the same name as the file
				const testsPath = files.find((f) =>
					TEST_SUFFIXES.find((suffix) => f === `${name}${suffix}`)
				);

				const { dependencies, devDependencies, local, imports } = lang
					.resolveDependencies({
						filePath: blockDir,
						isSubDir: false,
						excludeDeps,
						cwd,
						dirs,
					})
					.match(
						(val) => val,
						(err) => {
							program.error(color.red(err));
						}
					);

				const block: Block = {
					name,
					directory: path.relative(cwd, categoryDir),
					category: categoryName,
					tests: testsPath !== undefined,
					subdirectory: false,
					list: shouldListCategory ? shouldListBlock : false,
					files: [file],
					localDependencies: local,
					_imports_: imports,
					dependencies,
					devDependencies,
				};

				if (testsPath !== undefined) {
					block.files.push(testsPath);
				}

				category.blocks.push(block);
			} else {
				const blockName = file;

				let shouldListBlock = true;

				if (doNotListBlocks.includes(blockName)) {
					shouldListBlock = false;
				}

				if (listBlocks.length > 0 && !listBlocks.includes(blockName)) {
					shouldListBlock = false;
				}

				// if excludeBlocks enabled and block is part of excludeBlocks skip adding it
				if (
					excludeBlocks.length > 0 &&
					excludeBlocks.find((val) => val.trim() === blockName.trim())
				)
					continue;

				// if includeBlocks enabled and block is not part of includeBlocks skip adding it
				if (
					includeBlocks.length > 0 &&
					!includeBlocks.find((val) => val.trim() === blockName.trim())
				)
					continue;

				const blockFiles = fs.readdirSync(blockDir);

				const hasTests = blockFiles.findIndex((f) => isTestFile(f)) !== -1;

				const localDepsSet = new Set<string>();
				const depsSet = new Set<string>();
				const devDepsSet = new Set<string>();
				const imports: Record<string, string> = {};

				// if it is a directory
				for (const f of blockFiles) {
					if (isTestFile(f)) continue;

					if (fs.statSync(path.join(blockDir, f)).isDirectory()) {
						const error = 'subdirectories are not currently supported!';

						console.warn(
							`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped \`${color.bold(path.join(blockDir, f))}\` ${error}`
						);
						continue;
					}

					const lang = languages.find((resolver) => resolver.matches(f));

					if (!lang) {
						const error = 'files are not currently supported!';

						console.warn(
							`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped \`${path.join(blockDir, f)}\` \`*${color.bold(
								path.parse(f).ext
							)}\` ${error}`
						);
						continue;
					}

					const {
						local,
						dependencies,
						devDependencies,
						imports: imps,
					} = lang
						.resolveDependencies({
							filePath: path.join(blockDir, f),
							isSubDir: true,
							excludeDeps,
							cwd,
							dirs,
						})
						.match(
							(val) => val,
							(err) => {
								program.error(color.red(err));
							}
						);

					for (const dep of local) {
						// don't add self
						if (dep === `${categoryName}/${blockName}`) continue;

						localDepsSet.add(dep);
					}

					for (const dep of dependencies) {
						depsSet.add(dep);
					}

					for (const dep of devDependencies) {
						devDepsSet.add(dep);
					}

					for (const [k, v] of Object.entries(imps)) {
						imports[k] = v;
					}
				}

				const block: Block = {
					name: blockName,
					directory: path.relative(cwd, blockDir),
					category: categoryName,
					tests: hasTests,
					subdirectory: true,
					list: shouldListCategory ? shouldListBlock : false,
					files: [...blockFiles],
					localDependencies: Array.from(localDepsSet.keys()),
					dependencies: Array.from(depsSet.keys()),
					devDependencies: Array.from(devDepsSet.keys()),
					_imports_: imports,
				};

				category.blocks.push(block);
			}
		}

		categories.push(category);
	}

	return categories;
};

/** Takes the given file and returns the block name */
const transformBlockName = (file: string) => {
	// DO NOT enable until resolution is fixed
	// custom transform for `.svelte.(js|ts)` files to drop the `.svelte` as well
	// if (file.endsWith('.svelte.ts') || file.endsWith('.svelte.js')) {
	// 	return file.slice(0, file.length - 10);
	// }

	return path.parse(path.basename(file)).name;
};

const pruneUnused = (categories: Category[]): [Category[], number] => {
	const pruned: Category[] = [];
	const prunedCount = 0;

	for (const category of categories) {
		const catBlocks: Block[] = [];

		for (const block of category.blocks) {
			const specifier = `${block.category}/${block.name}`;

			if (!block.list) {
				const dependedOn = isDependedOn(specifier, categories);

				if (!dependedOn) continue;
			}

			catBlocks.push(block);
		}

		if (catBlocks.length > 0) pruned.push({ name: category.name, blocks: catBlocks });
	}

	return [pruned, prunedCount];
};

const readCategories = (outputFilePath: string): Category[] =>
	v.parse(v.array(categorySchema), JSON.parse(fs.readFileSync(outputFilePath).toString()));

export { buildBlocksDirectory, readCategories, isTestFile, pruneUnused };
