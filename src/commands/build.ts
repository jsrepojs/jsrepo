import fs from 'node:fs';
import { log, outro } from '@clack/prompts';
import color from 'chalk';
import { Command, program } from 'commander';
import ignore from 'ignore';
import path from 'pathe';
import * as v from 'valibot';
import { MANIFEST_FILE } from '../constants';
import type { Category } from '../types';
import * as ascii from '../utils/ascii';
import { buildBlocksDirectory, buildConfigFiles, pruneUnused } from '../utils/build';
import { DEFAULT_CONFIG, runRules } from '../utils/build/check';
import { getRegistryConfig, IGNORES, type RegistryConfig } from '../utils/config';
import { createManifest, parseManifest } from '../utils/manifest';
import { intro, spinner } from '../utils/prompts';

const schema = v.object({
	dirs: v.optional(v.array(v.string())),
	outputDir: v.optional(v.string()),
	includeBlocks: v.optional(v.array(v.string())),
	includeCategories: v.optional(v.array(v.string())),
	includeFiles: v.optional(v.array(v.string())),
	excludeBlocks: v.optional(v.array(v.string())),
	excludeCategories: v.optional(v.array(v.string())),
	excludeDeps: v.optional(v.array(v.string())),
	listBlocks: v.optional(v.array(v.string())),
	listCategories: v.optional(v.array(v.string())),
	doNotListBlocks: v.optional(v.array(v.string())),
	doNotListCategories: v.optional(v.array(v.string())),
	allowSubdirectories: v.optional(v.boolean()),
	preview: v.optional(v.boolean()),
	includeDocs: v.optional(v.boolean()),
	output: v.boolean(),
	verbose: v.boolean(),
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

const build = new Command('build')
	.description(`Builds the provided --dirs in the project root into a \`${MANIFEST_FILE}\` file.`)
	.option('--dirs [dirs...]', 'The directories containing the blocks.')
	.option(
		'--output-dir <dir>',
		'The directory to output the registry to. (Copies jsrepo-manifest.json + all required files)'
	)
	.option('--include-blocks [blockNames...]', 'Include only the blocks with these names.')
	.option(
		'--include-categories [categoryNames...]',
		'Include only the categories with these names.'
	)
	.option(
		'--include-files [filePatterns...]',
		'Additional files to include in the manifest. (Supports glob patterns)'
	)
	.option('--exclude-blocks [blockNames...]', 'Do not include the blocks with these names.')
	.option(
		'--exclude-categories [categoryNames...]',
		'Do not include the categories with these names.'
	)
	.option('--list-blocks [blockNames...]', 'List only the blocks with these names.')
	.option('--list-categories [categoryNames...]', 'List only the categories with these names.')
	.option('--do-not-list-blocks [blockNames...]', 'Do not list the blocks with these names.')
	.option(
		'--do-not-list-categories [categoryNames...]',
		'Do not list the categories with these names.'
	)
	.option('--exclude-deps [deps...]', 'Dependencies that should not be added.')
	.option('--allow-subdirectories', 'Allow subdirectories to be built.')
	.option('--preview', 'Display a preview of the blocks list.')
	.option('--include-docs', 'Include docs files (*.mdx, *.md) in the registry.')
	.option('--no-output', `Do not output a \`${MANIFEST_FILE}\` file.`)
	.option('--verbose', 'Include debug logs.', false)
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (opts) => {
		const options = v.parse(schema, opts);

		await intro();

		await _build(options);

		outro(color.green('All done!'));
	});

async function _build(options: Options) {
	const verbose = (msg: string) => {
		if (options.verbose) {
			console.info(`${ascii.INFO} ${msg}`);
		}
	};

	const loading = spinner({ verbose: options.verbose ? verbose : undefined });

	const categories: Category[] = [];

	const config: RegistryConfig = getRegistryConfig(options.cwd).match(
		(val) => {
			if (val === null) {
				return {
					$schema: '',
					readme: 'README.md',
					dirs: options.dirs ?? [],
					outputDir: options.outputDir,
					doNotListBlocks: options.doNotListBlocks ?? [],
					doNotListCategories: options.doNotListCategories ?? [],
					listBlocks: options.listBlocks ?? [],
					listCategories: options.listCategories ?? [],
					excludeDeps: options.excludeDeps ?? [],
					includeBlocks: options.includeBlocks ?? [],
					includeCategories: options.includeCategories ?? [],
					includeFiles: options.includeFiles ?? [],
					excludeBlocks: options.excludeBlocks ?? [],
					excludeCategories: options.excludeCategories ?? [],
					allowSubdirectories: options.allowSubdirectories,
					preview: options.preview,
					includeDocs: options.includeDocs ?? false,
				} satisfies RegistryConfig;
			}

			const mergedVal = val;

			// overwrites config with flag values

			if (options.dirs) mergedVal.dirs = options.dirs;
			if (options.outputDir) mergedVal.outputDir = options.outputDir;
			if (options.doNotListBlocks) mergedVal.doNotListBlocks = options.doNotListBlocks;
			if (options.doNotListCategories)
				mergedVal.doNotListCategories = options.doNotListCategories;
			if (options.listBlocks) mergedVal.listBlocks = options.listBlocks;
			if (options.listCategories) mergedVal.listCategories = options.listCategories;
			if (options.includeBlocks) mergedVal.includeBlocks = options.includeBlocks;
			if (options.includeCategories) mergedVal.includeCategories = options.includeCategories;
			if (options.includeFiles) mergedVal.includeFiles = options.includeFiles;
			if (options.excludeBlocks) mergedVal.excludeBlocks = options.excludeBlocks;
			if (options.excludeCategories) mergedVal.excludeCategories = options.excludeCategories;
			if (options.excludeDeps) mergedVal.excludeDeps = options.excludeDeps;
			if (options.allowSubdirectories !== undefined)
				mergedVal.allowSubdirectories = options.allowSubdirectories;
			if (options.preview !== undefined) mergedVal.preview = options.preview;
			if (options.includeDocs !== undefined) mergedVal.includeDocs = options.includeDocs;

			mergedVal.rules = { ...DEFAULT_CONFIG, ...mergedVal.rules };

			return mergedVal;
		},
		(err) => program.error(color.red(err))
	);

	let outDir: string;

	if (config.outputDir) {
		outDir = path.join(options.cwd, config.outputDir);
	} else {
		outDir = options.cwd;
	}

	const manifestOut = path.join(outDir, MANIFEST_FILE);

	if (options.output && fs.existsSync(manifestOut)) {
		// we need to remove all previously copied directories
		if (config.outputDir) {
			// read old manifest to determine where the unwanted files are
			// we can't just rm -rf because other static files could be hosted out of the same directory
			const oldManifest = parseManifest(fs.readFileSync(manifestOut).toString());

			if (oldManifest.isOk()) {
				// first just remove all the files
				for (const category of oldManifest.unwrap().categories) {
					for (const block of category.blocks) {
						const newDirPath = path.join(outDir, block.directory);

						if (fs.existsSync(newDirPath)) {
							fs.rmSync(newDirPath, { recursive: true });
						}
					}
				}
			}
		}

		fs.rmSync(manifestOut);
	}

	const ig = ignore();

	try {
		const ignoreFile = fs.readFileSync(path.join(options.cwd, '.gitignore')).toString();

		ig.add(ignoreFile);
	} catch {
		// just continue on
	}

	ig.add(IGNORES);

	for (const dir of config.dirs) {
		const dirPath = path.join(options.cwd, dir);

		loading.start(`Building ${color.cyan(dirPath)}`);

		const builtCategories = buildBlocksDirectory(dirPath, {
			cwd: options.cwd,
			ignore: ig,
			config,
		});

		for (const category of builtCategories) {
			if (categories.find((cat) => cat.name === category.name) !== undefined) {
				console.warn(
					`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped adding \`${color.cyan(`${dir}/${category.name}`)}\` because a category with the same name already exists!`
				);
				continue;
			}

			categories.push(category);
		}

		loading.stop(`Built ${color.cyan(dirPath)}`);
	}

	const configFiles = buildConfigFiles(config, { cwd: options.cwd });

	const manifest = createManifest(categories, configFiles, config);

	loading.start('Checking manifest');

	const { warnings, errors } = runRules(manifest, config, options.cwd, config.rules);

	loading.stop('Completed checking manifest.');

	// add gap for errors
	if (warnings.length > 0 || errors.length > 0) {
		console.log(ascii.VERTICAL_LINE);
	}

	for (const warning of warnings) {
		console.log(warning);
	}

	if (errors.length > 0) {
		for (const error of errors) {
			console.log(error);
		}

		program.error(
			color.red(
				`Completed checking manifest with ${color.bold(`${errors.length} error(s)`)} and ${color.bold(`${warnings.length} warning(s)`)}`
			)
		);
	}

	// removes any unused blocks or categories
	const [prunedCategories, count] = pruneUnused(manifest.categories);

	manifest.categories = prunedCategories;

	if (count > 0) {
		log.step(`Removed ${count} unused block${count > 1 ? 's' : ''}.`);
	}

	if (config.preview) {
		const blocks = manifest.categories.flatMap((cat) =>
			cat.blocks.filter((b) => b.list).map((b) => `${color.cyan(b.category)}/${b.name}`)
		);

		log.message(`${color.yellow('Preview')}:`);

		for (const block of blocks) {
			console.log(`${ascii.VERTICAL_LINE}  ◻ ${block}`);
		}
	}

	if (options.output) {
		if (config.outputDir) {
			loading.start(`Copying registry files to \`${color.cyan(outDir)}\``);

			// copy config files to output directory
			if (manifest.configFiles) {
				for (const file of manifest.configFiles) {
					const originalPath = path.join(options.cwd, file.path);
					const destPath = path.join(outDir, file.path);

					const containing = path.join(destPath, '../');

					if (!fs.existsSync(containing)) {
						fs.mkdirSync(containing, { recursive: true });
					}

					fs.copyFileSync(originalPath, destPath);
				}
			}

			// copy the files for each block in each category
			for (const category of manifest.categories) {
				for (const block of category.blocks) {
					const originalPath = path.join(options.cwd, block.directory);
					const newDirPath = path.join(outDir, block.directory);

					for (const file of block.files) {
						const containing = path.join(newDirPath, file, '../');

						if (!fs.existsSync(containing)) {
							fs.mkdirSync(containing, { recursive: true });
						}

						fs.copyFileSync(path.join(originalPath, file), path.join(newDirPath, file));
					}
				}
			}

			loading.stop(`Copied registry files to \`${color.cyan(outDir)}\``);
		}

		loading.start(`Writing output to \`${color.cyan(manifestOut)}\``);

		// write manifest
		fs.writeFileSync(manifestOut, JSON.stringify(manifest, null, '\t'));

		loading.stop(`Wrote output to \`${color.cyan(manifestOut)}\``);
	}
}

export { build };
