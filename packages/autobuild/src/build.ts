import fs from 'node:fs';
import ignore from 'ignore';
import type { RegistryConfigArgs, RegistryItem } from 'jsrepo/config';
import path from 'pathe';
import type { BuildOptions } from './index';

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

const IGNORES = [
	'node_modules',
	'.git',
	'.next',
	'.nuxt',
	'.svelte-kit',
	'dist',
	'build',
	'.DS_Store',
	'*.log',
];

function isTestFile(file: string): boolean {
	return TEST_SUFFIXES.some((suffix) => file.endsWith(suffix));
}

function isDocsFile(file: string): boolean {
	return DOCS_SUFFIXES.some((suffix) => file.endsWith(suffix));
}

function transformBlockName(file: string): string {
	return path.parse(path.basename(file)).name;
}

function shouldListBlock(name: string, config: BuildOptions): boolean {
	if (
		config.doNotListBlocks &&
		config.doNotListBlocks.length > 0 &&
		config.doNotListBlocks.includes(name)
	) {
		return false;
	}
	if (config.listBlocks && config.listBlocks.length > 0) {
		return config.listBlocks.includes(name);
	}
	return true;
}

function shouldIncludeBlock(name: string, config: BuildOptions): boolean {
	if (
		config.excludeBlocks &&
		config.excludeBlocks.length > 0 &&
		config.excludeBlocks.includes(name)
	) {
		return false;
	}
	if (config.includeBlocks && config.includeBlocks.length > 0) {
		return config.includeBlocks.includes(name);
	}
	return true;
}

function shouldListType(name: string, config: BuildOptions): boolean {
	if (
		config.doNotListTypes &&
		config.doNotListTypes.length > 0 &&
		config.doNotListTypes.includes(name)
	) {
		return false;
	}
	if (config.listTypes && config.listTypes.length > 0) {
		return config.listTypes.includes(name);
	}
	return true;
}

function shouldIncludeType(name: string, config: BuildOptions): boolean {
	if (
		config.excludeTypes &&
		config.excludeTypes.length > 0 &&
		config.excludeTypes.includes(name)
	) {
		return false;
	}
	if (config.includeTypes && config.includeTypes.length > 0) {
		return config.includeTypes.includes(name);
	}
	return true;
}

function createShouldIncludeFile(config: BuildOptions) {
	if (!config.includeFiles || config.includeFiles.length === 0) {
		return () => false;
	}
	const ig = ignore().add(config.includeFiles.map((p) => p.replace(/^(\.\/|\/)/, '')));
	return (filePathRelativeToRoot: string) => ig.ignores(filePathRelativeToRoot);
}

export async function buildItems(
	options: BuildOptions & { additionalItems?: RegistryItem[] },
	args: RegistryConfigArgs[0]
): Promise<RegistryItem[]> {
	const items: RegistryItem[] = [...(options.additionalItems ?? [])];
	const ig = ignore();

	// Add .gitignore if it exists
	try {
		const gitignorePath = path.join(args.cwd, '.gitignore');
		if (fs.existsSync(gitignorePath)) {
			const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
			ig.add(gitignoreContent);
		}
	} catch {
		// Continue if .gitignore doesn't exist or can't be read
	}

	ig.add(IGNORES);

	for (const dir of options.dirs) {
		const dirPath = path.join(args.cwd, dir);

		if (!fs.existsSync(dirPath)) {
			continue;
		}

		let paths: string[];
		try {
			paths = fs.readdirSync(dirPath);
		} catch {
			continue;
		}

		for (const typePath of paths) {
			const typeDir = path.join(dirPath, typePath);

			// Only check folders
			if (!fs.statSync(typeDir).isDirectory()) continue;

			// Check if directory should be ignored
			const dirName = `${path.relative(args.cwd, typeDir)}/`;
			if (ig.ignores(dirName)) continue;

			const typeName = path.basename(typePath);
			if (!shouldIncludeType(typeName, options)) continue;

			const listType = shouldListType(typeName, options);

			let files: string[];
			try {
				files = fs.readdirSync(typeDir);
			} catch {
				continue;
			}

			for (const file of files) {
				const blockDir = path.join(typeDir, file);
				const relativePath = path.relative(args.cwd, blockDir);

				if (ig.ignores(relativePath)) continue;

				const stat = fs.statSync(blockDir);

				if (stat.isFile()) {
					if (isTestFile(file)) continue;

					if (isDocsFile(file)) {
						if (!options.includeDocs) {
							continue;
						}
					}

					const name = transformBlockName(file);
					const listBlock = shouldListBlock(name, options);

					if (!shouldIncludeBlock(name, options)) continue;

					const blockFiles: string[] = [file];

					// Check for test file
					const testsPath = files.find((f) =>
						TEST_SUFFIXES.find((suffix) => f === `${name}${suffix}`)
					);
					if (testsPath) blockFiles.push(testsPath);

					// Check for docs file
					const docsPath = files.find((f) =>
						DOCS_SUFFIXES.find((suffix) => f === `${name}${suffix}`)
					);
					if (docsPath && options.includeDocs) blockFiles.push(docsPath);

					const item: RegistryItem = {
						name,
						type: typeName,
						add: listType ? (listBlock ? 'when-added' : 'when-needed') : 'when-needed',
						files: blockFiles.map((f) => ({
							path: path.join(path.relative(args.cwd, typeDir), f),
							role: isDocsFile(f) ? 'doc' : isTestFile(f) ? 'test' : 'file',
						})),
					};

					items.push(item);
				} else if (stat.isDirectory()) {
					const blockName = file;
					const listBlock = shouldListBlock(blockName, options);

					if (!shouldIncludeBlock(blockName, options)) continue;

					const blockFiles: string[] = [];

					const shouldIncludeFile = createShouldIncludeFile(options);

					const walkFiles = (base: string, files: string[]) => {
						for (const f of files) {
							const filePath = path.join(base, f);
							const relativeFilePath = filePath.slice(blockDir.length + 1);
							const relativeToRootDirectory = filePath
								.replace(args.cwd, '')
								.replace(/^\/+/, '');

							if (isTestFile(f)) {
								blockFiles.push(relativeFilePath);
								continue;
							}

							if (isDocsFile(f)) {
								if (!options.includeDocs) {
									continue;
								}
								blockFiles.push(relativeFilePath);
								continue;
							}

							if (shouldIncludeFile(relativeToRootDirectory)) {
								blockFiles.push(relativeFilePath);
								continue;
							}

							const fileStat = fs.statSync(filePath);
							if (fileStat.isDirectory()) {
								if (!options.allowSubdirectories) {
									continue;
								}
								const subFiles = fs.readdirSync(filePath);
								walkFiles(filePath, subFiles);
								continue;
							}

							blockFiles.push(relativeFilePath);
						}
					};

					walkFiles(blockDir, fs.readdirSync(blockDir));

					const item: RegistryItem = {
						name: blockName,
						type: typeName,
						add: listType ? (listBlock ? 'when-added' : 'when-needed') : 'when-needed',
						files: [
							{
								path: path.relative(args.cwd, blockDir),
								files: blockFiles.map((f) => ({
									path: f,
									role: isDocsFile(f) ? 'doc' : isTestFile(f) ? 'test' : 'file',
								})),
							},
						],
					};

					items.push(item);
				}
			}
		}
	}

	return items;
}
