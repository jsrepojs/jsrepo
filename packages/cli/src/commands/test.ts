import fs from 'node:fs';
import { cancel, confirm, isCancel, outro, spinner } from '@clack/prompts';
import color from 'chalk';
import { Argument, Command, program } from 'commander';
import { execa } from 'execa';
import { resolveCommand } from 'package-manager-detector/commands';
import { detect } from 'package-manager-detector/detect';
import path from 'pathe';
import { Project } from 'ts-morph';
import * as v from 'valibot';
import { context } from '../cli';
import * as ascii from '../utils/ascii';
import { getInstalled } from '../utils/blocks';
import { type Block, isTestFile } from '../utils/build';
import { getProjectConfig, resolvePaths } from '../utils/config';
import { OUTPUT_FILE } from '../utils/context';
import * as gitProviders from '../utils/git-providers';
import { intro } from '../utils/prompts';

const schema = v.object({
	repo: v.optional(v.string()),
	allow: v.boolean(),
	debug: v.boolean(),
	verbose: v.boolean(),
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

const test = new Command('test')
	.description('Tests local blocks against most recent remote tests.')
	.addArgument(new Argument('[blocks...]', 'The blocks you want to test.').default([]))
	.option('--repo <repo>', 'Repository to download the blocks from.')
	.option('-A, --allow', 'Allow jsrepo to download code from the provided repo.', false)
	.option('--debug', 'Leaves the temp test file around for debugging upon failure.', false)
	.option('--verbose', 'Include debug logs.', false)
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (blockNames, opts) => {
		const options = v.parse(schema, opts);

		intro(context);

		await _test(blockNames, options);

		outro(color.green('All done!'));
	});

type RemoteBlock = Block & { sourceRepo: gitProviders.Info };

const _test = async (blockNames: string[], options: Options) => {
	const verbose = (msg: string) => {
		if (options.verbose) {
			console.info(`${ascii.INFO} ${msg}`);
		}
	};

	verbose(`Attempting to test ${JSON.stringify(blockNames)}`);

	const config = getProjectConfig(options.cwd).match(
		(val) => val,
		(err) => program.error(color.red(err))
	);

	const loading = spinner();

	const blocksMap: Map<string, RemoteBlock> = new Map();

	let repoPaths = config.repos;

	// we just want to override all others if supplied via the CLI
	if (options.repo) repoPaths = [options.repo];

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

	verbose(`Fetching blocks from ${color.cyan(repoPaths.join(', '))}`);

	if (!options.verbose) loading.start(`Fetching blocks from ${color.cyan(repoPaths.join(', '))}`);

	for (const repo of repoPaths) {
		const providerInfo: gitProviders.Info = (await gitProviders.getProviderInfo(repo)).match(
			(info) => info,
			(err) => program.error(color.red(err))
		);

		const manifest = await providerInfo.provider.fetchManifest(providerInfo);

		verbose(`Got info for provider ${color.cyan(providerInfo.name)}`);

		if (manifest.isErr()) {
			if (!options.verbose) loading.stop(`Error fetching ${color.cyan(repo)}`);
			program.error(
				color.red(
					`There was an error fetching the \`${OUTPUT_FILE}\` from the repository ${color.cyan(
						repo
					)} make sure the target repository has a \`${OUTPUT_FILE}\` in its root?`
				)
			);
		}

		const categories = manifest.unwrap();

		for (const category of categories) {
			for (const block of category.blocks) {
				// blocks will override each other
				blocksMap.set(
					`${providerInfo.name}/${providerInfo.owner}/${providerInfo.repoName}/${category.name}/${block.name}`,
					{
						...block,
						sourceRepo: providerInfo,
					}
				);
			}
		}
	}

	verbose(`Retrieved blocks from ${color.cyan(repoPaths.join(', '))}`);

	if (!options.verbose) loading.stop(`Retrieved blocks from ${color.cyan(repoPaths.join(', '))}`);

	const tempTestDirectory = path.resolve(
		path.join(options.cwd, `blocks-tests-temp-${Date.now()}`)
	);

	verbose(`Trying to create the temp directory ${color.bold(tempTestDirectory)}.`);

	fs.mkdirSync(tempTestDirectory, { recursive: true });

	const cleanUp = () => {
		fs.rmSync(tempTestDirectory, { recursive: true, force: true });
	};

	const installedBlocks = getInstalled(blocksMap, config, options.cwd).map(
		(val) => val.specifier
	);

	let testingBlocks = blockNames;

	// in the case that we want to test all files
	if (blockNames.length === 0) {
		testingBlocks = installedBlocks;
	}

	if (testingBlocks.length === 0) {
		cleanUp();
		program.error(color.red('There were no blocks found in your project!'));
	}

	const testingBlocksMapped: { name: string; block: RemoteBlock }[] = [];

	for (const blockSpecifier of testingBlocks) {
		let block: RemoteBlock | undefined = undefined;

		// if the block starts with github (or another provider) we know it has been resolved
		if (!gitProviders.providers.find((p) => blockSpecifier.startsWith(p.name()))) {
			for (const repo of repoPaths) {
				// we unwrap because we already checked this
				const providerInfo = (await gitProviders.getProviderInfo(repo)).unwrap();

				const tempBlock = blocksMap.get(
					`${providerInfo.name}/${providerInfo.owner}/${providerInfo.repoName}/${blockSpecifier}`
				);

				if (tempBlock === undefined) continue;

				block = tempBlock;

				break;
			}
		} else {
			if (repoPaths.length === 0) {
				const [providerName, owner, repoName, ...rest] = blockSpecifier.split('/');

				let repo: string;
				// if rest is greater than 2 it isn't the block specifier so it is part of the path
				if (rest.length > 2) {
					repo = `${providerName}/${owner}/${repoName}/${rest.slice(0, rest.length - 2).join('/')}`;
				} else {
					repo = `${providerName}/${owner}/${repoName}`;
				}

				const providerInfo = (await gitProviders.getProviderInfo(repo)).match(
					(val) => val,
					(err) => program.error(color.red(err))
				);

				const categories = (await providerInfo.provider.fetchManifest(providerInfo)).match(
					(val) => val,
					(err) => program.error(color.red(err))
				);

				for (const category of categories) {
					for (const block of category.blocks) {
						blocksMap.set(
							`${providerInfo.name}/${providerInfo.owner}/${providerInfo.repoName}/${category.name}/${block.name}`,
							{
								...block,
								sourceRepo: providerInfo,
							}
						);
					}
				}
			}

			block = blocksMap.get(blockSpecifier);
		}

		if (!block) {
			program.error(
				color.red(`Invalid block! ${color.bold(blockSpecifier)} does not exist!`)
			);
		}

		testingBlocksMapped.push({ name: blockSpecifier, block });
	}

	const resolvedPathsResult = resolvePaths(config.paths, options.cwd);

	if (resolvedPathsResult.isErr()) {
		program.error(color.red(resolvedPathsResult.unwrapErr()));
	}

	const resolvedPaths = resolvedPathsResult.unwrap();

	for (const { block } of testingBlocksMapped) {
		const providerInfo = block.sourceRepo;

		const fullSpecifier = `${block.sourceRepo.url}/${block.category}/${block.name}`;

		if (!options.verbose) {
			loading.start(`Setting up test file for ${color.cyan(fullSpecifier)}`);
		}

		if (!block.tests) {
			loading.stop(`No tests found for ${color.cyan(fullSpecifier)}`);
			continue;
		}

		let directory: string;

		if (resolvedPaths[block.category] !== undefined) {
			directory = path.join(options.cwd, resolvedPaths[block.category]);
		} else {
			directory = path.join(options.cwd, resolvedPaths['*'], block.category);
		}

		directory = path.relative(tempTestDirectory, directory);

		const getSourceFile = async (filePath: string) => {
			const content = await providerInfo.provider.fetchRaw(providerInfo, filePath);

			if (content.isErr()) {
				loading.stop(color.red(`Error fetching ${color.bold(filePath)}`));
				program.error(color.red(`There was an error trying to get ${fullSpecifier}`));
			}

			return content.unwrap();
		};

		verbose(`Downloading and copying test files for ${fullSpecifier}`);

		const testFiles: string[] = [];

		for (const testFile of block.files.filter((file) => isTestFile(file))) {
			const content = await getSourceFile(path.join(block.directory, testFile));

			const destPath = path.join(tempTestDirectory, testFile);

			fs.writeFileSync(destPath, content);

			testFiles.push(destPath);
		}

		const project = new Project();

		// resolve imports for the block
		for (const file of testFiles) {
			verbose(`Opening test file ${file}`);

			const tempFile = project.addSourceFileAtPath(file);

			for (const importDeclaration of tempFile.getImportDeclarations()) {
				const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

				let newModuleSpecifier: string | undefined = undefined;

				// if the module is relative resolve it relative to the new path of the tests
				if (moduleSpecifier.startsWith('.')) {
					if (block.subdirectory) {
						newModuleSpecifier = path.join(directory, block.name, moduleSpecifier);
					} else {
						newModuleSpecifier = path.join(directory, moduleSpecifier);
					}
				}

				if (newModuleSpecifier) {
					// we need to add the replace so that paths are correctly translated on windows
					importDeclaration.setModuleSpecifier(newModuleSpecifier.replaceAll(/\\/g, '/'));
				}
			}
		}

		project.saveSync();

		verbose(`Completed ${color.cyan.bold(fullSpecifier)} test file`);

		if (!options.verbose) {
			loading.stop(`Completed setup for ${color.bold(fullSpecifier)}`);
		}
	}

	verbose('Beginning testing');

	const pm = await detect({ cwd: options.cwd });

	if (pm == null) {
		program.error(color.red('Could not detect package manager'));
	}

	const resolved = resolveCommand(pm.agent, 'execute', ['vitest', 'run', tempTestDirectory]);

	if (resolved == null) {
		program.error(color.red(`Could not resolve add command for '${pm.agent}'.`));
	}

	const testCommand = `${resolved.command} ${resolved.args.join(' ')}`;

	verbose(`Running ${color.cyan(testCommand)} on ${color.cyan(options.cwd)}`);

	try {
		await execa(resolved.command, resolved.args, {
			cwd: options.cwd,
			stdin: process.stdin,
			stdout: process.stdout,
		});

		cleanUp();
	} catch (err) {
		if (options.debug) {
			console.info(
				`${color.bold('--debug')} flag provided. Skipping cleanup. Run '${color.bold(
					testCommand
				)}' to retry tests.\n`
			);
		} else {
			cleanUp();
		}

		program.error(color.red(`Tests failed! Error ${err}`));
	}
};

export { test };
