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
} from '@clack/prompts';
import color from 'chalk';
import { Command, program } from 'commander';
import { diffLines } from 'diff';
import { resolveCommand } from 'package-manager-detector/commands';
import { detect } from 'package-manager-detector/detect';
import path from 'pathe';
import * as v from 'valibot';
import { context } from '../cli';
import { type ModelName, models } from '../utils/ai';
import * as ascii from '../utils/ascii';
import { getInstalled, resolveTree } from '../utils/blocks';
import * as url from '../utils/blocks/utils/url';
import { isTestFile } from '../utils/build';
import { getPathForBlock, getProjectConfig, resolvePaths } from '../utils/config';
import { installDependencies } from '../utils/dependencies';
import { formatDiff } from '../utils/diff';
import { formatFile, transformRemoteContent } from '../utils/files';
import { loadFormatterConfig } from '../utils/format';
import { getWatermark } from '../utils/get-watermark';
import { returnShouldInstall } from '../utils/package';
import { type Task, intro, nextSteps, runTasks } from '../utils/prompts';
import * as registry from '../utils/registry-providers/internal';

const schema = v.object({
	all: v.boolean(),
	expand: v.boolean(),
	maxUnchanged: v.number(),
	no: v.boolean(),
	repo: v.optional(v.string()),
	allow: v.boolean(),
	yes: v.boolean(),
	verbose: v.boolean(),
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

const update = new Command('update')
	.description('Update blocks to the code in the remote repository.')
	.argument('[blocks...]', 'Names of the blocks you want to update. ex: (utils/math)')
	.option('--all', 'Update all installed components.', false)
	.option('-E, --expand', 'Expands the diff so you see everything.', false)
	.option(
		'--max-unchanged <number>',
		'Maximum unchanged lines that will show without being collapsed.',
		(val) => Number.parseInt(val), // this is such a dumb api thing
		3
	)
	.option('-n, --no', 'Do update any blocks.', false)
	.option('--repo <repo>', 'Repository to download the blocks from.')
	.option('-A, --allow', 'Allow jsrepo to download code from the provided repo.', false)
	.option('-y, --yes', 'Skip confirmation prompt.', false)
	.option('--verbose', 'Include debug logs.', false)
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (blockNames, opts) => {
		const options = v.parse(schema, opts);

		intro(context);

		await _update(blockNames, options);

		outro(color.green('All done!'));
	});

const _update = async (blockNames: string[], options: Options) => {
	const verbose = (msg: string) => {
		if (options.verbose) {
			console.info(`${ascii.INFO} ${msg}`);
		}
	};

	verbose(`Attempting to update ${JSON.stringify(blockNames)}`);

	const loading = spinner();

	const config = getProjectConfig(options.cwd).match(
		(val) => val,
		(err) => program.error(color.red(err))
	);

	let repoPaths = config.repos;

	// we just want to override all others if supplied via the CLI
	if (options.repo) repoPaths = [options.repo];

	// ensure blocks do not provide repos
	for (const blockSpecifier of blockNames) {
		if (registry.providers.find((p) => blockSpecifier.startsWith(p.name))) {
			program.error(
				color.red(
					`Invalid value provided for block names \`${color.bold(blockSpecifier)}\`. Block names are expected to be provided in the format of \`${color.bold('<category>/<name>')}\``
				)
			);
		}
	}

	if (!options.allow && options.repo) {
		const result = await confirm({
			message: `Allow ${color.cyan('jsrepo')} to download and run code from ${color.cyan(options.repo)}?`,
			initialValue: true,
		});

		if (isCancel(result) || !result) {
			cancel('Canceled!');
			process.exit(0);
		}
	}

	verbose(`Resolving ${color.cyan(repoPaths.join(', '))}`);

	if (!options.verbose) loading.start(`Fetching blocks from ${color.cyan(repoPaths.join(', '))}`);

	const resolvedRepos: registry.RegistryProviderState[] = (
		await registry.forEachPathGetProviderState(...repoPaths)
	).match(
		(val) => val,
		({ repo, message }) => {
			loading.stop(`Failed to get info for ${color.cyan(repo)}`);
			program.error(color.red(message));
		}
	);

	verbose(`Resolved ${color.cyan(repoPaths.join(', '))}`);

	verbose(`Fetching blocks from ${color.cyan(repoPaths.join(', '))}`);

	const blocksMap: Map<string, registry.RemoteBlock> = (
		await registry.fetchBlocks(...resolvedRepos)
	).match(
		(val) => val,
		({ repo, message }) => {
			loading.stop(`Failed fetching blocks from ${color.cyan(repo)}`);
			program.error(color.red(message));
		}
	);

	if (!options.verbose) loading.stop(`Retrieved blocks from ${color.cyan(repoPaths.join(', '))}`);

	verbose(`Retrieved blocks from ${color.cyan(repoPaths.join(', '))}`);

	const installedBlocks = getInstalled(blocksMap, config, options.cwd);

	if (installedBlocks.length === 0) {
		program.error(
			color.red(
				`You haven't installed any blocks yet. Did you mean to \`${color.bold('add')}\`?`
			)
		);
	}

	let updatingBlockNames = blockNames;

	if (options.all) {
		updatingBlockNames = installedBlocks.map((block) => block.specifier);
	}

	// if no blocks are provided prompt the user for what blocks they want
	if (updatingBlockNames.length === 0) {
		const promptResult = await multiselect({
			message: `Which blocks would you like to ${options.no ? 'diff' : 'update'}?`,
			options: installedBlocks
				.filter((b) => b.block.list)
				.map((block) => {
					return {
						label: `${color.cyan(block.block.category)}/${block.block.name}`,
						value: block.specifier,
					};
				}),
			required: true,
		});

		if (isCancel(promptResult)) {
			cancel('Canceled!');
			process.exit(0);
		}

		updatingBlockNames = promptResult as string[];
	}

	verbose(`Preparing to update ${color.cyan(updatingBlockNames.join(', '))}`);

	const updatingBlocks = (await resolveTree(updatingBlockNames, blocksMap, resolvedRepos)).match(
		(val) => val,
		program.error
	);

	const pm = (await detect({ cwd: options.cwd }))?.agent ?? 'npm';

	const tasks: Task[] = [];

	let devDeps: Set<string> = new Set<string>();
	let deps: Set<string> = new Set<string>();

	const { prettierOptions, biomeOptions } = await loadFormatterConfig({
		formatter: config.formatter,
		cwd: options.cwd,
	});

	const resolvedPathsResult = resolvePaths(config.paths, options.cwd);

	if (resolvedPathsResult.isErr()) {
		program.error(color.red(resolvedPathsResult.unwrapErr()));
	}

	const resolvedPaths = resolvedPathsResult.unwrap();

	let model: ModelName = 'Claude 3.5 Sonnet';

	for (const { block } of updatingBlocks) {
		const fullSpecifier = url.join(block.sourceRepo.url, block.category, block.name);

		const watermark = getWatermark(context.package.version, block.sourceRepo.url);

		const providerState = block.sourceRepo;

		verbose(`Attempting to add ${fullSpecifier}`);

		const directory = getPathForBlock(block, resolvedPaths, options.cwd);

		const files: { content: string; destPath: string; fileName: string }[] = [];

		const getSourceFile = async (filePath: string) => {
			const content = await registry.fetchRaw(providerState, filePath, {
				verbose,
			});

			if (content.isErr()) {
				loading.stop(color.red(`Error fetching ${color.bold(filePath)}`));
				program.error(color.red(`There was an error trying to get ${fullSpecifier}`));
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

			const content = await getSourceFile(sourcePath);

			fs.mkdirSync(destPath.slice(0, destPath.length - sourceFile.length), {
				recursive: true,
			});

			files.push({ content, destPath, fileName: sourceFile });
		}

		process.stdout.write(`${ascii.VERTICAL_LINE}\n`);

		process.stdout.write(`${ascii.VERTICAL_LINE}  ${fullSpecifier}\n`);

		for (const file of files) {
			const remoteContentResult = await transformRemoteContent({
				file,
				biomeOptions,
				prettierOptions,
				config,
				imports: block._imports_,
				watermark,
				verbose,
				cwd: options.cwd,
			});

			if (remoteContentResult.isErr()) {
				program.error(color.red(remoteContentResult.unwrapErr()));
			}

			const originalRemoteContent = remoteContentResult.unwrap();

			let remoteContent = remoteContentResult.unwrap();

			let acceptedChanges = options.yes;

			if (!options.yes) {
				process.stdout.write(`${ascii.VERTICAL_LINE}\n`);

				let localContent = '';
				if (fs.existsSync(file.destPath)) {
					localContent = fs.readFileSync(file.destPath).toString();
				}

				const from = url.join(providerState.url, file.fileName);

				const to = path.relative(options.cwd, file.destPath);

				while (true) {
					const changes = diffLines(localContent, remoteContent);

					// print diff
					const formattedDiff = formatDiff({
						from,
						to,
						changes,
						expand: options.expand,
						maxUnchanged: options.maxUnchanged,
						prefix: () => `${ascii.VERTICAL_LINE}  `,
						onUnchanged: ({ from, to, prefix }) =>
							`${prefix?.() ?? ''}${color.cyan(from)} → ${color.gray(to)} ${color.gray('(unchanged)')}\n`,
						intro: ({ from, to, changes, prefix }) => {
							const totalChanges = changes.filter((a) => a.added || a.removed).length;

							return `${prefix?.() ?? ''}${color.cyan(from)} → ${color.gray(to)} (${totalChanges} change${
								totalChanges === 1 ? '' : 's'
							})\n${prefix?.() ?? ''}\n`;
						},
					});

					process.stdout.write(formattedDiff);

					// if there are no changes then don't ask
					if (changes.length > 1 || localContent === '') {
						acceptedChanges = options.yes;

						if (!options.yes && !options.no) {
							// prompt the user
							const confirmResult = await select({
								message: 'Accept changes?',
								options: [
									{
										label: 'Accept',
										value: 'accept',
									},
									{
										label: 'Reject',
										value: 'reject',
									},
									{
										label: `✨ ${color.yellow('Update with AI')} ✨`,
										value: 'update',
									},
								],
							});

							if (isCancel(confirmResult)) {
								cancel('Canceled!');
								process.exit(0);
							}

							if (confirmResult === 'update') {
								// prompt for model
								const modelResult = await select({
									message: 'Select a model',
									options: Object.keys(models).map((key) => ({
										label: key,
										value: key,
									})),
								});

								if (isCancel(modelResult)) {
									cancel('Canceled!');
									process.exit(0);
								}

								model = modelResult as ModelName;

								try {
									remoteContent = await models[model].updateFile({
										originalFile: {
											content: localContent,
											path: to,
										},
										newFile: {
											content: originalRemoteContent,
											path: from,
										},
										loading,
										verbose: options.verbose ? verbose : undefined,
									});
								} catch (err) {
									loading.stop();
									log.error(color.red(`Error getting completions: ${err}`));
									process.stdout.write(`${ascii.VERTICAL_LINE}\n`);
									continue;
								}

								remoteContent = await formatFile({
									file: {
										content: remoteContent,
										destPath: file.destPath,
									},
									biomeOptions,
									prettierOptions,
									config,
								});

								process.stdout.write(`${ascii.VERTICAL_LINE}\n`);

								continue;
							}

							acceptedChanges = confirmResult === 'accept';

							break;
						}
					}

					break; // there were no changes or changes were automatically accepted
				}
			}

			if (acceptedChanges) {
				await runTasks(
					[
						{
							loadingMessage: `Writing changes to ${color.cyan(file.destPath)}`,
							completedMessage: `Wrote changes to ${color.cyan(file.destPath)}.`,
							run: async () => fs.writeFileSync(file.destPath, remoteContent),
						},
					],
					{
						verbose: options.verbose ? verbose : undefined,
					}
				);
			}
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
	}

	await runTasks(tasks, { verbose: options.verbose ? verbose : undefined });

	// check if dependencies are already installed
	const requiredDependencies = returnShouldInstall(deps, devDeps, { cwd: options.cwd });

	deps = requiredDependencies.dependencies;
	devDeps = requiredDependencies.devDependencies;

	const hasDependencies = deps.size > 0 || devDeps.size > 0;

	if (hasDependencies) {
		let install = options.yes;
		if (!options.yes && !options.no) {
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
				const cmd = resolveCommand(pm, 'add', [...deps]);

				steps.push(
					`Install dependencies \`${color.cyan(`${cmd?.command} ${cmd?.args.join(' ')}`)}\``
				);
			}

			if (devDeps.size > 0) {
				const cmd = resolveCommand(pm, 'add', [...devDeps, '-D']);

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

export { update };
