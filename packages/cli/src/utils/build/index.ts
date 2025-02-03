import fs from 'node:fs';
import color from 'chalk';
import { program } from 'commander';
import type { Ignore } from 'ignore';
import path from 'pathe';
import * as v from 'valibot';
import { type Block, type Category, categorySchema } from '../../types';
import * as ascii from '../ascii';
import type { RegistryConfig } from '../config';
import { languages } from '../language-support';
import { isDependedOn } from './check';

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
const buildBlocksDirectory = (blocksPath: string, { cwd, ignore, config }: Options): Category[] => {
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

		// we only check folders
		if (stat.isFile()) continue;

		// we append a '/' to tell ignore that this is a directory not a file
		const ignorable = `${path.relative(cwd, categoryDir)}/`;

		if (ignore.ignores(ignorable)) continue;

		const categoryName = path.basename(categoryPath);

		if (!shouldIncludeCategory(categoryName, config)) continue;

		const listCategory = shouldListCategory(categoryName, config);

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

				const listBlock = shouldListBlock(name, config);

				if (!shouldIncludeBlock(name, config)) continue;

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
						excludeDeps: config.excludeDeps,
						dirs: config.dirs,
						cwd,
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
					list: listCategory ? listBlock : false,
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

				const listBlock = shouldListBlock(blockName, config);

				if (!shouldIncludeBlock(blockName, config)) continue;

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
							excludeDeps: config.excludeDeps,
							dirs: config.dirs,
							cwd,
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
					list: listCategory ? listBlock : false,
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

const shouldListBlock = (name: string, config: RegistryConfig) => {
	// the length check is just a short circuit here
	if (config.doNotListBlocks.length > 0 && config.doNotListBlocks.includes(name)) return false;

	// if the we only list the provided
	// we should only list if the name is included in that list
	if (config.listBlocks.length > 0) {
		return config.listBlocks.includes(name);
	}

	return true;
};

const shouldIncludeBlock = (name: string, config: RegistryConfig) => {
	// the length check is just a short circuit here
	if (config.excludeBlocks.length > 0 && config.excludeBlocks.includes(name)) return false;

	// if the we only include the provided
	// we should only include if the name is included in that list
	if (config.includeBlocks.length > 0) {
		return config.includeBlocks.includes(name);
	}

	return true;
};

const shouldListCategory = (name: string, config: RegistryConfig) => {
	// the length check is just a short circuit here
	if (config.doNotListCategories.length > 0 && config.doNotListCategories.includes(name))
		return false;

	// if the we only list the provided
	// we should only list if the name is included in that list
	if (config.listCategories.length > 0) {
		return config.listCategories.includes(name);
	}

	return true;
};

const shouldIncludeCategory = (name: string, config: RegistryConfig) => {
	// the length check is just a short circuit here
	if (config.excludeCategories.length > 0 && config.excludeCategories.includes(name))
		return false;

	// if the we only include the provided
	// we should only include if the name is included in that list
	if (config.includeCategories.length > 0) {
		return config.includeCategories.includes(name);
	}

	return true;
};

/** Takes the given file and returns the block name */
const transformBlockName = (file: string) => {
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
