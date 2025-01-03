import fs from 'node:fs';
import {
	cancel,
	confirm,
	isCancel,
	log,
	multiselect,
	outro,
	select,
	spinner,
	text,
} from '@clack/prompts';
import color from 'chalk';
import { Command, program } from 'commander';
import { resolveCommand } from 'package-manager-detector/commands';
import { detect } from 'package-manager-detector/detect';
import path from 'pathe';
import * as v from 'valibot';
import { context } from '../cli';
import * as ascii from '../utils/ascii';
import { getInstalled, resolveTree } from '../utils/blocks';
import { type Block, isTestFile } from '../utils/build';
import {
	type Formatter,
	type ProjectConfig,
	getProjectConfig,
	projectConfigSchema,
	resolvePaths,
} from '../utils/config';
import { installDependencies } from '../utils/dependencies';
import { transformRemoteContent } from '../utils/files';
import { loadFormatterConfig } from '../utils/format';
import { getWatermark } from '../utils/get-watermark';
import * as gitProviders from '../utils/git-providers';
import { returnShouldInstall } from '../utils/package';
import * as persisted from '../utils/persisted';
import {
	type ConcurrentTask,
	intro,
	nextSteps,
	runTasksConcurrently,
	truncatedList,
} from '../utils/prompts';

const schema = v.object({
	repo: v.optional(v.string()),
	allow: v.boolean(),
	yes: v.boolean(),
	verbose: v.boolean(),
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

const add = new Command('add')
	.description('Add blocks to your project.')
	.argument(
		'[blocks...]',
		'Names of the blocks you want to add to your project. ex: (utils/math, github/ieedan/std/utils/math)'
	)
	.option('--repo <repo>', 'Repository to download the blocks from.')
	.option('-A, --allow', 'Allow jsrepo to download code from the provided repo.', false)
	.option('-y, --yes', 'Skip confirmation prompt.', false)
	.option('--verbose', 'Include debug logs.', false)
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (blockNames, opts) => {
		const options = v.parse(schema, opts);

		intro(context.package.version);

		await _add(blockNames, options);

		outro(color.green('All done!'));
	});

type RemoteBlock = Block & { sourceRepo: gitProviders.Info };

const _add = async (blockNames: string[], options: Options) => {
	const verbose = (msg: string) => {
		if (options.verbose) {
			console.info(`${ascii.INFO} ${msg}`);
		}
	};

	verbose(`Attempting to add ${JSON.stringify(blockNames)}`);

	const loading = spinner();

	const configResult = getProjectConfig(options.cwd);

	/** The user has opted for no config */
	const noConfig = configResult.isErr();

	let config: ProjectConfig;

	if (configResult.isErr()) {
		let shouldContinue = options.yes;

		if (!options.yes) {
			const response = await confirm({
				message: `You don't have ${ascii.JSREPO} initialized in your project. Do you want to continue?`,
				initialValue: false,
			});

			if (isCancel(response)) {
				cancel('Canceled!');
				process.exit(0);
			}

			shouldContinue = response;
		}

		if (!shouldContinue) {
			cancel('Canceled!');
			process.exit(0);
		}

		// add default config used for default values in prompts
		config = {
			$schema: '',
			includeTests: false,
			watermark: true,
			paths: {
				'*': './src/blocks',
			},
			repos: [],
		};
	} else {
		config = configResult.unwrap();
	}

	let repoPaths = config.repos;

	// we just want to override all others if supplied via the CLI
	if (options.repo) repoPaths = [options.repo];

	// resolve repos for blocks
	for (const blockSpecifier of blockNames) {
		// we are only getting repos for blocks that specified repos
		if (!gitProviders.providers.find((p) => blockSpecifier.startsWith(p.name()))) continue;

		const [providerName, owner, repoName, ...rest] = blockSpecifier.split('/');

		let repo: string;
		// if rest is greater than 2 it isn't the block specifier so it is part of the path
		if (rest.length > 2) {
			repo = `${providerName}/${owner}/${repoName}/${rest.slice(0, rest.length - 2).join('/')}`;
		} else {
			repo = `${providerName}/${owner}/${repoName}`;
		}

		if (!repoPaths.find((repoPath) => repoPath === repo)) {
			if (!options.allow) {
				const result = await confirm({
					message: `Allow ${ascii.JSREPO} to download and run code from ${color.cyan(repo)}?`,
					initialValue: true,
				});

				if (isCancel(result) || !result) {
					cancel('Canceled!');
					process.exit(0);
				}
			}

			repoPaths.push(repo);
		}
	}

	if (!options.allow && options.repo) {
		const result = await confirm({
			message: `Allow ${ascii.JSREPO} to download and run code from ${color.cyan(options.repo)}?`,
			initialValue: true,
		});

		if (isCancel(result) || !result) {
			cancel('Canceled!');
			process.exit(0);
		}
	}

	if (repoPaths.length === 0) {
		if (noConfig) {
			program.error(
				color.red(
					`Fully quality blocks ex: (github/ieedan/std/utils/math) or provide the \`${color.bold(
						'--repo'
					)}\` flag to specify a registry.`
				)
			);
		}

		program.error(
			color.red(
				`There were no repos present in your config and you didn't provide the \`${color.bold(
					'--repo'
				)}\` flag with a repo.`
			)
		);
	}

	verbose(`Resolving ${color.cyan(repoPaths.join(', '))}`);

	if (!options.verbose) loading.start(`Fetching blocks from ${color.cyan(repoPaths.join(', '))}`);

	const resolvedRepos: gitProviders.ResolvedRepo[] = (
		await gitProviders.resolvePaths(...repoPaths)
	).match(
		(val) => val,
		({ repo, message }) => {
			loading.stop(`Failed to get info for ${color.cyan(repo)}`);
			program.error(color.red(message));
		}
	);

	verbose(`Resolved ${color.cyan(repoPaths.join(', '))}`);

	verbose(`Fetching blocks from ${color.cyan(repoPaths.join(', '))}`);

	const blocksMap: Map<string, RemoteBlock> = (
		await gitProviders.fetchBlocks(...resolvedRepos)
	).match(
		(val) => val,
		({ repo, message }) => {
			loading.stop(`Failed fetching blocks from ${color.cyan(repo)}`);
			program.error(color.red(message));
		}
	);

	if (!options.verbose) loading.stop(`Retrieved blocks from ${color.cyan(repoPaths.join(', '))}`);

	verbose(`Retrieved blocks from ${color.cyan(repoPaths.join(', '))}`);

	const installedBlocks = getInstalled(blocksMap, config, options.cwd).map(
		(val) => val.specifier
	);

	let installingBlockNames = blockNames;

	// if no blocks are provided prompt the user for what blocks they want
	if (installingBlockNames.length === 0) {
		const promptResult = await multiselect({
			message: 'Select which blocks to add.',
			options: Array.from(blocksMap.entries())
				.filter(([_, value]) => value.list)
				.map(([key, value]) => {
					const shortName = `${value.category}/${value.name}`;

					const blockExists =
						installedBlocks.findIndex((block) => block === shortName) !== -1;

					let label: string;

					// show the full repo if there are multiple repos
					if (repoPaths.length > 1) {
						label = `${color.cyan(
							`${value.sourceRepo.name}/${value.sourceRepo.owner}/${value.sourceRepo.repoName}/${value.category}`
						)}/${value.name}`;
					} else {
						label = `${color.cyan(value.category)}/${value.name}`;
					}

					return {
						label: blockExists ? color.gray(label) : label,
						value: key,
						// show hint for `Installed` if block is already installed
						hint: blockExists ? 'Installed' : undefined,
					};
				}),
			required: true,
		});

		if (isCancel(promptResult)) {
			cancel('Canceled!');
			process.exit(0);
		}

		installingBlockNames = promptResult as string[];
	}

	verbose(`Installing blocks ${color.cyan(installingBlockNames.join(', '))}`);

	if (options.verbose) console.log('Blocks map: ', blocksMap);

	const installingBlocks = (
		await resolveTree(installingBlockNames, blocksMap, resolvedRepos)
	).match(
		(val) => val,
		(err) => program.error(err)
	);

	const pm = (await detect({ cwd: options.cwd }))?.agent ?? 'npm';

	const tasks: ConcurrentTask[] = [];

	let devDeps: Set<string> = new Set<string>();
	let deps: Set<string> = new Set<string>();

	const store = persisted.get();

	if (noConfig) {
		const zeroConfigKey = `${options.cwd}-zero-config`;

		const zeroConfigParsed = v.safeParse(projectConfigSchema, store.get(zeroConfigKey));

		const zeroConfig = zeroConfigParsed.success ? zeroConfigParsed.output : config;

		const categories = Array.from(new Set(installingBlocks.map((b) => b.block.category)));

		for (const cat of categories) {
			const blocksPath = await text({
				message: `Where would you like to add ${color.cyan(cat)}?`,
				placeholder: zeroConfig ? zeroConfig.paths[cat] : `./src/${cat}`,
				initialValue: zeroConfig ? zeroConfig.paths[cat] : `./src/${cat}`,
				defaultValue: zeroConfig ? zeroConfig.paths[cat] : `./src/${cat}`,
				validate(value) {
					if (value.trim() === '') return 'Please provide a value';
				},
			});

			if (isCancel(blocksPath)) {
				cancel('Canceled!');
				process.exit(0);
			}

			config.paths[cat] = blocksPath;
		}

		if (!options.yes) {
			const includeTests = await confirm({
				message: 'Include tests?',
				initialValue: zeroConfig.includeTests,
			});

			if (isCancel(includeTests)) {
				cancel('Canceled!');
				process.exit(0);
			}

			config.includeTests = includeTests;

			const addWatermark = await confirm({
				message: 'Add watermark?',
				initialValue: zeroConfig.watermark,
			});

			if (isCancel(addWatermark)) {
				cancel('Canceled!');
				process.exit(0);
			}

			config.watermark = addWatermark;
		}

		let defaultFormatter = 'none';

		if (fs.existsSync(path.join(options.cwd, '.prettierrc'))) {
			defaultFormatter = 'prettier';
		}

		if (fs.existsSync(path.join(options.cwd, 'biome.json'))) {
			defaultFormatter = 'biome';
		}

		const response = await select({
			message: 'What formatter would you like to use?',
			options: ['Prettier', 'Biome', 'None'].map((val) => ({
				value: val.toLowerCase(),
				label: val,
			})),
			initialValue:
				defaultFormatter === 'none'
					? zeroConfig.formatter
						? zeroConfig.formatter
						: 'none'
					: defaultFormatter,
		});

		if (isCancel(response)) {
			cancel('Canceled!');
			process.exit(0);
		}

		if (response !== 'none') {
			config.formatter = response as Formatter;
		}

		store.set(zeroConfigKey, config);
	}

	const { prettierOptions, biomeOptions } = await loadFormatterConfig({
		formatter: config.formatter,
		cwd: options.cwd,
	});

	const resolvedPathsResult = resolvePaths(config.paths, options.cwd);

	if (resolvedPathsResult.isErr()) {
		program.error(color.red(resolvedPathsResult.unwrapErr()));
	}

	const resolvedPaths = resolvedPathsResult.unwrap();

	const addedBlocks: string[] = [];

	let overwriteAll: boolean | undefined;

	for (const { block } of installingBlocks) {
		const fullSpecifier = `${block.sourceRepo.url}/${block.category}/${block.name}`;
		const shortSpecifier = `${block.category}/${block.name}`;
		const watermark = getWatermark(context.package.version, block.sourceRepo.url);

		const providerInfo = block.sourceRepo;

		verbose(`Setting up ${fullSpecifier}`);

		let directory: string;

		if (resolvedPaths[block.category] !== undefined) {
			directory = path.join(options.cwd, resolvedPaths[block.category]);
		} else {
			directory = path.join(options.cwd, resolvedPaths['*'], block.category);
		}

		const blockExists = installedBlocks.find((b) => shortSpecifier === b);

		if (blockExists && !options.yes && !overwriteAll) {
			if (overwriteAll === undefined) {
				const overwriteBlocks = installingBlocks
					.map((installing) => `${installing.block.category}/${installing.block.name}`)
					.filter((spec) => installedBlocks.find((b) => b === spec));

				log.warn(
					`The following components ${color.bold.yellow('already exist')}: ${color.cyan(truncatedList(overwriteBlocks))}`
				);

				const overwrite = await confirm({
					message: `Would you like to ${color.bold.red('overwrite')} all existing components?`,
					active: 'Yes, overwrite everything',
					inactive: 'No, let me decide individually',
					initialValue: false,
				});

				if (isCancel(overwrite)) {
					cancel('Canceled!');
					process.exit(0);
				}

				overwriteAll = overwrite;
			}

			if (!overwriteAll) {
				const result = await confirm({
					message: `${color.cyan(shortSpecifier)} already exists in your project would you like to overwrite it?`,
					initialValue: false,
				});

				if (isCancel(result)) {
					cancel('Canceled!');
					process.exit(0);
				}

				// just skip this block if they don't want to overwrite it
				if (!result) continue;
			}
		}

		addedBlocks.push(shortSpecifier);

		tasks.push({
			run: async ({ message }) => {
				message(`Adding ${color.cyan(fullSpecifier)}`);

				verbose(`Creating directory ${color.bold(directory)}`);

				// in case the directory didn't already exist
				fs.mkdirSync(directory, { recursive: true });

				verbose(`Created directory ${color.bold(directory)}`);

				const files: { content: string; destPath: string }[] = [];

				const getSourceFile = async (filePath: string) => {
					const content = await providerInfo.provider.fetchRaw(providerInfo, filePath, {
						verbose,
					});

					if (content.isErr()) {
						loading.stop(color.red(`Error fetching ${color.bold(filePath)}`));
						program.error(
							color.red(`There was an error trying to get ${fullSpecifier}`)
						);
					}

					return content.unwrap();
				};

				for (const sourceFile of block.files) {
					if (!config.includeTests && isTestFile(sourceFile)) continue;

					const sourcePath = path.join(block.directory, sourceFile);

					let destPath: string;
					if (block.subdirectory) {
						destPath = path.join(directory, block.name, sourceFile);
					} else {
						destPath = path.join(directory, sourceFile);
					}

					verbose(`Adding ${color.bold(sourcePath)}`);

					const content = await getSourceFile(sourcePath);

					const pathFolder = destPath.slice(0, destPath.length - sourceFile.length);

					verbose(`Creating directory ${color.bold(pathFolder)}`);

					fs.mkdirSync(pathFolder, {
						recursive: true,
					});

					verbose(`Created directory ${color.bold(pathFolder)}`);

					files.push({ content, destPath });

					verbose(`Got ${color.bold(sourcePath)}`);
				}

				for (const file of files) {
					const content = await transformRemoteContent({
						file,
						biomeOptions,
						prettierOptions,
						config,
						imports: block._imports_,
						watermark,
						verbose,
						cwd: options.cwd,
					});

					if (content.isErr()) {
						program.error(color.red(content.unwrapErr()));
					}

					verbose(`Writing to ${color.bold(file.destPath)}`);

					fs.writeFileSync(file.destPath, content.unwrap());
				}

				if (config.includeTests && block.tests) {
					verbose('Trying to include tests');

					const { devDependencies } = JSON.parse(
						fs.readFileSync(path.join(options.cwd, 'package.json')).toString()
					);

					if (devDependencies === undefined || devDependencies.vitest === undefined) {
						devDeps.add('vitest');
					}
				}

				for (const dep of block.devDependencies) {
					devDeps.add(dep);
				}

				for (const dep of block.dependencies) {
					deps.add(dep);
				}
			},
		});
	}

	await runTasksConcurrently({
		startMessage: 'Adding blocks',
		stopMessage: `Added ${color.cyan(addedBlocks.join(', '))}`,
		tasks,
		verbose: options.verbose ? verbose : undefined,
	});

	// check if dependencies are already installed
	const requiredDependencies = returnShouldInstall(deps, devDeps, { cwd: options.cwd });

	deps = requiredDependencies.dependencies;
	devDeps = requiredDependencies.devDependencies;

	const hasDependencies = deps.size > 0 || devDeps.size > 0;

	if (hasDependencies) {
		let install = options.yes;
		if (!options.yes) {
			const result = await confirm({
				message: 'Would you like to install dependencies?',
				initialValue: true,
			});

			if (isCancel(result)) {
				cancel('Canceled!');
				process.exit(0);
			}

			install = result;
		}

		if (install) {
			if (deps.size > 0) {
				if (!options.verbose)
					loading.start(`Installing dependencies with ${color.cyan(pm)}`);

				(
					await installDependencies({
						pm,
						deps: Array.from(deps),
						dev: false,
						cwd: options.cwd,
					})
				).match(
					(installed) => {
						if (!options.verbose)
							loading.stop(`Installed ${color.cyan(installed.join(', '))}`);
					},
					(err) => {
						if (!options.verbose) loading.stop('Failed to install dependencies');

						program.error(err);
					}
				);
			}

			if (devDeps.size > 0) {
				if (!options.verbose)
					loading.start(`Installing dependencies with ${color.cyan(pm)}`);

				(
					await installDependencies({
						pm,
						deps: Array.from(devDeps),
						dev: true,
						cwd: options.cwd,
					})
				).match(
					(installed) => {
						if (!options.verbose)
							loading.stop(`Installed ${color.cyan(installed.join(', '))}`);
					},
					(err) => {
						if (!options.verbose) loading.stop('Failed to install dev dependencies');

						program.error(err);
					}
				);
			}
		}

		// next steps if they didn't install dependencies
		let steps = [];

		if (!install) {
			if (deps.size > 0) {
				const cmd = resolveCommand(pm, 'install', [...deps]);

				steps.push(
					`Install dependencies \`${color.cyan(`${cmd?.command} ${cmd?.args.join(' ')}`)}\``
				);
			}

			if (devDeps.size > 0) {
				const cmd = resolveCommand(pm, 'install', [...devDeps, '-D']);

				steps.push(
					`Install dev dependencies \`${color.cyan(`${cmd?.command} ${cmd?.args.join(' ')}`)}\``
				);
			}
		}

		// put steps with numbers above here
		steps = steps.map((step, i) => `${i + 1}. ${step}`);

		if (!install) {
			steps.push('');
		}

		steps.push('Import and use the blocks!');

		const next = nextSteps(steps);

		process.stdout.write(next);
	}
};

export { add };
