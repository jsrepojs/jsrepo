import fs from 'node:fs';
import { cancel, confirm, isCancel, select, spinner } from '@clack/prompts';
import color from 'chalk';
import { Argument, Command, program } from 'commander';
import { execa } from 'execa';
import { resolveCommand } from 'package-manager-detector/commands';
import { detect } from 'package-manager-detector/detect';
import path from 'pathe';
import * as v from 'valibot';
import * as ascii from '../utils/ascii';
import { resolveTree } from '../utils/blocks';
import * as url from '../utils/blocks/ts/url';
import { isTestFile } from '../utils/build';
import { type ProjectConfig, getProjectConfig, resolvePaths } from '../utils/config';
import { installDependencies } from '../utils/dependencies';
import { type ConcurrentTask, intro, runTasksConcurrently } from '../utils/prompts';
import * as registry from '../utils/registry-providers/internal';

const schema = v.objectWithRest(
	{
		repo: v.optional(v.string()),
		allow: v.boolean(),
		cache: v.boolean(),
		cwd: v.string(),
	},
	v.unknown()
);

type Options = v.InferInput<typeof schema>;

const exec = new Command('exec')
	.alias('x')
	.description('Execute a block as a script.')
	.addArgument(
		new Argument(
			'script',
			'Name of the script you want to execute. ex: (general/hello, github/ieedan/std/general/hello)'
		).argOptional()
	)
	.option('--repo <repo>', 'Repository to download and run the script from.')
	.option('-A, --allow', 'Allow jsrepo to download code from the provided repo.', false)
	.option('--no-cache', 'Disable caching of resolved git urls.')
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.allowExcessArguments()
	.allowUnknownOption()
	.action(async (script, opts, command) => {
		const options = v.parse(schema, opts);

		await intro();

		await _exec(script, options, command);
	});

// biome-ignore lint/suspicious/noExplicitAny: we don't have a type for command
const _exec = async (s: string | undefined, options: Options, command: any) => {
	let script = s;

	const loading = spinner();

	const configResult = getProjectConfig(options.cwd);

	/** The user has opted for no config */
	const noConfig = configResult.isErr();

	let config: ProjectConfig;

	if (configResult.isErr()) {
		// add default config used for default values in prompts
		config = {
			$schema: '',
			includeTests: false,
			watermark: true,
			paths: {
				'*': './',
			},
			repos: [],
		};
	} else {
		config = configResult.unwrap();
	}

	let repoPaths = config.repos;

	// we just want to override all others if supplied via the CLI
	if (options.repo) repoPaths = [options.repo];

	const provider = script ? registry.selectProvider(script) : undefined;

	// we are only getting repos for blocks that specified repos
	if (script && provider) {
		const { url: repo } = provider.parse(script, { fullyQualified: true });

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

			repoPaths = [repo];
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
					`Fully quality your script ex: (github/ieedan/std/scripts/build) or provide the \`${color.bold(
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

	loading.start(`Fetching scripts from ${color.cyan(repoPaths.join(', '))}`);

	const resolvedRepos: registry.RegistryProviderState[] = (
		await registry.forEachPathGetProviderState(repoPaths, { noCache: !options.cache })
	).match(
		(val) => val,
		({ repo, message }) => {
			loading.stop(`Failed to get info for ${color.cyan(repo)}`);
			program.error(color.red(message));
		}
	);

	const blocksMap = (await registry.fetchBlocks(...resolvedRepos)).match(
		(val) => val,
		({ repo, message }) => {
			loading.stop(`Failed fetching scripts from ${color.cyan(repo)}`);
			program.error(color.red(message));
		}
	);

	loading.stop(`Retrieved scripts from ${color.cyan(repoPaths.join(', '))}`);

	// if no blocks are provided prompt the user for what blocks they want
	if (!script) {
		const promptResult = await select({
			message: 'Select which script to run.',
			options: Array.from(blocksMap.entries())
				.filter(([_, value]) => value.list)
				.map(([key, value]) => {
					let label: string;

					// show the full repo if there are multiple repos
					if (repoPaths.length > 1) {
						label = `${color.cyan(url.join(value.sourceRepo.url, value.category))}/${value.name}`;
					} else {
						label = `${color.cyan(value.category)}/${value.name}`;
					}

					return {
						label: label,
						value: key,
					};
				}),
		});

		if (isCancel(promptResult)) {
			cancel('Canceled!');
			process.exit(0);
		}

		script = promptResult as string;
	}

	const installingBlocks = (await resolveTree([script], blocksMap, resolvedRepos)).match(
		(val) => val,
		(err) => program.error(err)
	);

	const tempDirBase = 'temp-jsrepo-exec';

	const tempDirectoryRelative = `./${tempDirBase}/${encodeURIComponent(script)}`;

	const tempDirectory = path.join(process.cwd(), tempDirectoryRelative);

	config.paths['*'] = tempDirectoryRelative;

	fs.mkdirSync(tempDirectory, { recursive: true });

	const pm = (await detect({ cwd: process.cwd() }))?.agent ?? 'npm';

	const tasks: ConcurrentTask[] = [];

	const devDeps: Set<string> = new Set<string>();
	const deps: Set<string> = new Set<string>();

	const resolvedPathsResult = resolvePaths(config.paths, options.cwd);

	if (resolvedPathsResult.isErr()) {
		program.error(color.red(resolvedPathsResult.unwrapErr()));
	}

	const resolvedPaths = resolvedPathsResult.unwrap();

	const addedBlocks: string[] = [];

	for (const { block } of installingBlocks) {
		const fullSpecifier = `${block.sourceRepo.url}/${block.category}/${block.name}`;
		const shortSpecifier = `${block.category}/${block.name}`;

		const providerInfo = block.sourceRepo;

		const directory = path.join(options.cwd, resolvedPaths['*'], block.category);

		addedBlocks.push(shortSpecifier);

		tasks.push({
			run: async ({ message }) => {
				message(`Adding ${color.cyan(fullSpecifier)}`);

				// in case the directory didn't already exist
				fs.mkdirSync(directory, { recursive: true });

				const files: { content: string; destPath: string }[] = [];

				const getSourceFile = async (filePath: string) => {
					const content = await registry.fetchRaw(providerInfo, filePath);

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

					const content = await getSourceFile(sourcePath);

					const pathFolder = destPath.slice(0, destPath.length - sourceFile.length);

					fs.mkdirSync(pathFolder, {
						recursive: true,
					});

					files.push({ content, destPath });
				}

				for (const file of files) {
					fs.writeFileSync(file.destPath, file.content);
				}

				if (config.includeTests && block.tests) {
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
	});

	const hasDependencies = deps.size > 0 || devDeps.size > 0;

	if (hasDependencies) {
		// add package.json
		const packageContent = {
			name: 'temp-package',
			type: 'module',
			version: '0.0.1',
		};

		const packagePath = path.join(tempDirectory, 'package.json');

		fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, '\t'));

		if (deps.size > 0) {
			if (!options.verbose) loading.start(`Installing dependencies with ${color.cyan(pm)}`);

			(
				await installDependencies({
					pm,
					deps: Array.from(deps),
					dev: false,
					cwd: tempDirectory,
					ignoreWorkspace: true,
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
			if (!options.verbose) loading.start(`Installing dependencies with ${color.cyan(pm)}`);

			(
				await installDependencies({
					pm,
					deps: Array.from(devDeps),
					dev: true,
					cwd: tempDirectory,
					ignoreWorkspace: true,
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

	const startIndex = (command.parent.rawArgs as string[]).findIndex((arg) => arg === '--');

	let passthroughArgs: string[] = [];

	if (startIndex !== -1) {
		passthroughArgs = command.parent.rawArgs.slice(startIndex + 1);
	}

	// run the cli

	console.clear();

	const runningBlock = installingBlocks[0];

	let file: string;

	// tsx seems to be smart enough to figure out if it is a .ts file
	if (runningBlock.block.subdirectory) {
		file = path.join(
			tempDirectory,
			`${runningBlock.block.category}/${runningBlock.block.name}/index.js`
		);
	} else {
		file = path.join(
			tempDirectory,
			`${runningBlock.block.category}/${runningBlock.block.name}.js`
		);
	}

	const cmd = resolveCommand(pm, 'execute', ['tsx', file, ...passthroughArgs]);

	if (!cmd) {
		program.error(color.red('Error resolving run command!'));
	}

	try {
		await execa(cmd.command, cmd.args, {
			cwd: process.cwd(),
			stdin: process.stdin,
			stdout: process.stdout,
		});
	} finally {
		fs.rmSync(path.join(process.cwd(), tempDirBase), { recursive: true, force: true });
	}
};

export { exec };
