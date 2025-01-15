import fs from 'node:fs';
import { log, outro, spinner } from '@clack/prompts';
import color from 'chalk';
import { Command, program } from 'commander';
import path from 'pathe';
import * as v from 'valibot';
import { context } from '../cli';
import * as ascii from '../utils/ascii';
import { type Category, buildBlocksDirectory, pruneUnused } from '../utils/build';
import { DEFAULT_CONFIG, runRules } from '../utils/build/check';
import { type RegistryConfig, getRegistryConfig } from '../utils/config';
import { OUTPUT_FILE } from '../utils/context';
import { intro } from '../utils/prompts';

const schema = v.object({
	dirs: v.optional(v.array(v.string())),
	includeBlocks: v.optional(v.array(v.string())),
	includeCategories: v.optional(v.array(v.string())),
	excludeBlocks: v.optional(v.array(v.string())),
	excludeCategories: v.optional(v.array(v.string())),
	excludeDeps: v.optional(v.array(v.string())),
	listBlocks: v.optional(v.array(v.string())),
	listCategories: v.optional(v.array(v.string())),
	doNotListBlocks: v.optional(v.array(v.string())),
	doNotListCategories: v.optional(v.array(v.string())),
	preview: v.optional(v.boolean()),
	output: v.boolean(),
	verbose: v.boolean(),
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

const build = new Command('build')
	.description(`Builds the provided --dirs in the project root into a \`${OUTPUT_FILE}\` file.`)
	.option('--dirs [dirs...]', 'The directories containing the blocks.')
	.option('--include-blocks [blockNames...]', 'Include only the blocks with these names.')
	.option(
		'--include-categories [categoryNames...]',
		'Include only the categories with these names.'
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
	.option('--preview', 'Display a preview of the blocks list.')
	.option('--no-output', `Do not output a \`${OUTPUT_FILE}\` file.`)
	.option('--verbose', 'Include debug logs.', false)
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (opts) => {
		const options = v.parse(schema, opts);

		intro(context);

		await _build(options);

		outro(color.green('All done!'));
	});

const _build = async (options: Options) => {
	const loading = spinner();

	let categories: Category[] = [];

	const config: RegistryConfig = getRegistryConfig(options.cwd).match(
		(val) => {
			if (val === null) {
				return {
					$schema: '',
					dirs: options.dirs ?? [],
					doNotListBlocks: options.doNotListBlocks ?? [],
					doNotListCategories: options.doNotListCategories ?? [],
					listBlocks: options.listBlocks ?? [],
					listCategories: options.listCategories ?? [],
					excludeDeps: options.excludeDeps ?? [],
					includeBlocks: options.includeBlocks ?? [],
					includeCategories: options.includeCategories ?? [],
					excludeBlocks: options.excludeBlocks ?? [],
					excludeCategories: options.excludeCategories ?? [],
					preview: options.preview,
				} satisfies RegistryConfig;
			}

			const mergedVal = val;

			// overwrites config with flag values

			if (options.dirs) mergedVal.dirs = options.dirs;
			if (options.doNotListBlocks) mergedVal.doNotListBlocks = options.doNotListBlocks;
			if (options.doNotListCategories)
				mergedVal.doNotListCategories = options.doNotListCategories;
			if (options.listBlocks) mergedVal.listBlocks = options.listBlocks;
			if (options.listCategories) mergedVal.listCategories = options.listCategories;
			if (options.includeBlocks) mergedVal.includeBlocks = options.includeBlocks;
			if (options.includeCategories) mergedVal.includeCategories = options.includeCategories;
			if (options.excludeBlocks) mergedVal.excludeBlocks = options.excludeBlocks;
			if (options.excludeCategories) mergedVal.excludeCategories = options.excludeCategories;
			if (options.excludeDeps) mergedVal.excludeDeps = options.excludeDeps;
			if (options.preview !== undefined) mergedVal.preview = options.preview;

			mergedVal.rules = { ...DEFAULT_CONFIG, ...mergedVal.rules };

			return mergedVal;
		},
		(err) => program.error(color.red(err))
	);

	const outFile = path.join(options.cwd, OUTPUT_FILE);

	for (const dir of config.dirs) {
		const dirPath = path.join(options.cwd, dir);

		loading.start(`Building ${color.cyan(dirPath)}`);

		if (options.output && fs.existsSync(outFile)) fs.rmSync(outFile);

		const builtCategories = buildBlocksDirectory(dirPath, { cwd: options.cwd, config });

		for (const category of builtCategories) {
			if (categories.find((cat) => cat.name === category.name) !== undefined) {
				const error = 'a category with the same name already exists!';

				console.warn(
					`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped adding \`${color.cyan(`${dir}/${category.name}`)}\` because ${error}`
				);
				continue;
			}

			categories.push(category);
		}

		loading.stop(`Built ${color.cyan(dirPath)}`);
	}

	loading.start('Checking manifest');

	const { warnings, errors } = runRules(categories, config, config.rules);

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
	const [prunedCategories, count] = pruneUnused(categories);

	categories = prunedCategories;

	if (count > 0) {
		log.step(`Removed ${count} unused block${count > 1 ? 's' : ''}.`);
	}

	if (config.preview) {
		const blocks = categories.flatMap((cat) =>
			cat.blocks.filter((b) => b.list).map((b) => `${color.cyan(b.category)}/${b.name}`)
		);

		log.message(`${color.yellow('Preview')}:`);

		for (const block of blocks) {
			console.log(`${ascii.VERTICAL_LINE}  ◻ ${block}`);
		}
	}

	if (options.output) {
		loading.start(`Writing output to \`${color.cyan(outFile)}\``);

		fs.writeFileSync(outFile, JSON.stringify(categories, null, '\t'));

		loading.stop(`Wrote output to \`${color.cyan(outFile)}\``);
	}
};

export { build };
