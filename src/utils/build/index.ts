import fs from 'node:fs';
import color from 'chalk';
import { program } from 'commander';
import type { Ignore } from 'ignore';
import baseIgnore from 'ignore';
import path from 'pathe';
import * as v from 'valibot';
import { type Block, type Category, categorySchema, type Manifest } from '../../types';
import * as ascii from '../ascii';
import * as strings from '../blocks/ts/strings';
import type { RegistryConfig } from '../config';
import { languages } from '../language-support';
import { isDependedOn } from './check';

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
	return strings.endsWithOneOf(file, TEST_SUFFIXES) !== undefined;
}

export function isDocsFile(file: string): boolean {
	return strings.endsWithOneOf(file, DOCS_SUFFIXES) !== undefined;
}

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
export function buildBlocksDirectory(
	blocksPath: string,
	{ cwd, ignore, config }: Options
): Category[] {
	let paths: string[];

	try {
		paths = fs.readdirSync(blocksPath);
	} catch {
		program.error(color.red(`Couldn't read the ${color.bold(blocksPath)} directory.`));
	}

	const categories: Category[] = [];

	for (const categoryPath of paths) {
		const categoryDir = path.join(blocksPath, categoryPath);

		// we only check folders
		if (fs.statSync(categoryDir).isFile()) continue;

		// we append a '/' to tell ignore that this is a directory not a file
		const dirName = `${path.relative(cwd, categoryDir)}/`;

		if (ignore.ignores(dirName)) continue;

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
			const relativePath = path.relative(cwd, blockDir);

			if (ignore.ignores(relativePath)) continue;

			if (fs.statSync(blockDir).isFile()) {
				if (isTestFile(file)) continue;

				if (isDocsFile(file)) {
					if (!config.includeDocs) {
						console.warn(
							`${ascii.VERTICAL_LINE}  ${ascii.WARN} Documentation files (*.md, *.mdx) are not included by default include them with ${color.bold('--include-docs')}!`
						);
					}

					continue;
				}

				const name = transformBlockName(file);

				const listBlock = shouldListBlock(name, config);

				if (!shouldIncludeBlock(name, config)) continue;

				const lang = languages.find((resolver) => resolver.matches(file));

				// warn for unsupported language
				if (!lang) {
					console.warn(
						`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped \`${color.bold(blockDir)}\` \`*${color.bold(
							path.parse(file).ext
						)}\` files are not currently supported!`
					);

					continue;
				}

				// tries to find a test file with the same name as the file
				const testsPath = files.find((f) =>
					TEST_SUFFIXES.find((suffix) => f === `${name}${suffix}`)
				);

				// tries to find a docs file with the same name as the file
				const docsPath = files.find((f) =>
					DOCS_SUFFIXES.find((suffix) => f === `${name}${suffix}`)
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
					docs: docsPath !== undefined,
					subdirectory: false,
					list: listCategory ? listBlock : false,
					files: [file],
					localDependencies: local,
					_imports_: imports,
					dependencies,
					devDependencies,
				};

				// if test file exists add the file
				if (testsPath !== undefined) block.files.push(testsPath);

				// if docs file exists add the file
				if (docsPath !== undefined) block.files.push(docsPath);

				category.blocks.push(block);
			} else {
				const blockName = file;

				const listBlock = shouldListBlock(blockName, config);

				if (!shouldIncludeBlock(blockName, config)) continue;

				const localDepsSet = new Set<string>();
				const depsSet = new Set<string>();
				const devDepsSet = new Set<string>();
				const imports: Record<string, string> = {};

				let hasTests = false;
				let hasDocs = false;

				const blockFiles: string[] = [];

				const shouldIncludeFile = createShouldIncludeFile(config);

				// if the user has enabled allow subdirectories we recursively check each directory and resolve any dependencies
				const walkFiles = (base: string, files: string[]) => {
					for (const f of files) {
						const filePath = path.join(base, f);
						// relative to the block root
						const relativeFilePath = filePath.slice(blockDir.length + 1);
						const relativeToRootDirectory = filePath.replace(cwd, '').replace('/', '');

						if (isTestFile(f)) {
							hasTests = true;

							blockFiles.push(relativeFilePath);
							continue;
						}

						if (isDocsFile(f)) {
							if (!config.includeDocs) {
								console.warn(
									`${ascii.VERTICAL_LINE}  ${ascii.WARN} Documentation files (*.md, *.mdx) are not included by default include them with ${color.bold('--include-docs')}!`
								);
							}

							hasDocs = true;
							blockFiles.push(relativeFilePath);
							continue;
						}

						if (shouldIncludeFile(relativeToRootDirectory)) {
							blockFiles.push(relativeFilePath);
							continue;
						}

						if (fs.statSync(filePath).isDirectory()) {
							if (!config.allowSubdirectories) {
								console.warn(
									`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped \`${color.bold(path.join(blockDir, f))}\` subdirectories are not allowed! Allow them with ${color.bold('--allow-subdirectories')}!`
								);
								continue;
							}

							const subFiles = fs.readdirSync(filePath);

							walkFiles(filePath, subFiles);

							continue;
						}

						const lang = languages.find((resolver) => resolver.matches(f));

						if (!lang) {
							console.warn(
								`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped \`${filePath}\` \`*${color.bold(
									path.parse(f).ext
								)}\` files are not currently supported!`
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
								isSubDir: true,
								excludeDeps: config.excludeDeps,
								dirs: config.dirs,
								containingDir: blockDir,
								filePath,
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

						blockFiles.push(relativeFilePath);
					}
				};

				walkFiles(blockDir, fs.readdirSync(blockDir));

				const block: Block = {
					name: blockName,
					directory: path.relative(cwd, blockDir),
					category: categoryName,
					tests: hasTests,
					docs: hasDocs,
					subdirectory: true,
					list: listCategory ? listBlock : false,
					files: blockFiles,
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
}

export function buildConfigFiles(
	config: RegistryConfig,
	{ cwd }: { cwd: string }
): Manifest['configFiles'] {
	if (!config.configFiles) return undefined;

	const configFiles: Manifest['configFiles'] = [];

	for (const file of config.configFiles) {
		const lang = languages.find((lang) => lang.matches(file.path));

		if (!lang) {
			// go ahead and add the file with no dependencies
			configFiles.push(file);

			continue;
		}

		const { dependencies, devDependencies, local } = lang
			.resolveDependencies({
				filePath: path.join(cwd, file.path),
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

		if (local.length > 0) {
			program.error(
				color.red(
					`${color.bold(file.name)} ${color.bold(file.path)} Config files cannot have local dependencies!`
				)
			);
		}

		configFiles.push({ ...file, dependencies, devDependencies });
	}

	return configFiles;
}

export function shouldListBlock(name: string, config: RegistryConfig) {
	// the length check is just a short circuit here
	if (config.doNotListBlocks.length > 0 && config.doNotListBlocks.includes(name)) return false;

	// if the we only list the provided
	// we should only list if the name is included in that list
	if (config.listBlocks.length > 0) {
		return config.listBlocks.includes(name);
	}

	return true;
}

export function shouldIncludeBlock(name: string, config: RegistryConfig) {
	// the length check is just a short circuit here
	if (config.excludeBlocks.length > 0 && config.excludeBlocks.includes(name)) return false;

	// if the we only include the provided
	// we should only include if the name is included in that list
	if (config.includeBlocks.length > 0) {
		return config.includeBlocks.includes(name);
	}

	return true;
}

export function shouldListCategory(name: string, config: RegistryConfig) {
	// the length check is just a short circuit here
	if (config.doNotListCategories.length > 0 && config.doNotListCategories.includes(name))
		return false;

	// if the we only list the provided
	// we should only list if the name is included in that list
	if (config.listCategories.length > 0) {
		return config.listCategories.includes(name);
	}

	return true;
}

export function shouldIncludeCategory(name: string, config: RegistryConfig) {
	// the length check is just a short circuit here
	if (config.excludeCategories.length > 0 && config.excludeCategories.includes(name))
		return false;

	// if the we only include the provided
	// we should only include if the name is included in that list
	if (config.includeCategories.length > 0) {
		return config.includeCategories.includes(name);
	}

	return true;
}

export function createShouldIncludeFile(config: RegistryConfig) {
	if (config.includeFiles.length === 0) return () => false;
	
	// Dispite it's name, the ignore package can also be used to include files.
	// It's just a pattern matching library based on the .gitignore syntax.
	const ignore = baseIgnore().add(config.includeFiles.map((p) => p.replace(/^(\.\/|\/)/, '')));

	return (filePathRelativeToRoot: string) => ignore.ignores(filePathRelativeToRoot);
}

/** Takes the given file and returns the block name */
function transformBlockName(file: string) {
	return path.parse(path.basename(file)).name;
}

export function pruneUnused(categories: Category[]): [Category[], number] {
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
}

export function readCategories(outputFilePath: string): Category[] {
	return v.parse(v.array(categorySchema), JSON.parse(fs.readFileSync(outputFilePath).toString()));
}
