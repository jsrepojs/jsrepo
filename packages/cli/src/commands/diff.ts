import fs from 'node:fs';
import { cancel, confirm, isCancel, outro, spinner } from '@clack/prompts';
import color from 'chalk';
import { Command, program } from 'commander';
import { diffLines } from 'diff';
import path from 'pathe';
import * as v from 'valibot';
import { context } from '../cli';
import * as ascii from '../utils/ascii';
import { getInstalled } from '../utils/blocks';
import { type Block, isTestFile } from '../utils/build';
import { getProjectConfig, resolvePaths } from '../utils/config';
import { formatDiff } from '../utils/diff';
import { getWatermark } from '../utils/get-watermark';
import * as gitProviders from '../utils/git-providers';
import { languages } from '../utils/language-support';
import { intro } from '../utils/prompts';

const schema = v.object({
	expand: v.boolean(),
	maxUnchanged: v.number(),
	repo: v.optional(v.string()),
	allow: v.boolean(),
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

const diff = new Command('diff')
	.description('Compares local blocks to the blocks in the provided repository.')
	.option('-E, --expand', 'Expands the diff so you see everything.', false)
	.option(
		'--max-unchanged <number>',
		'Maximum unchanged lines that will show without being collapsed.',
		(val) => Number.parseInt(val), // this is such a dumb api thing
		3
	)
	.option('--repo <repo>', 'Repository to download the blocks from.')
	.option('-A, --allow', 'Allow jsrepo to download code from the provided repo.', false)
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (opts) => {
		const options = v.parse(schema, opts);

		intro(context);

		await _diff(options);

		outro(color.green('All done!'));
	});

type RemoteBlock = Block & { sourceRepo: gitProviders.Info };

const _diff = async (options: Options) => {
	const loading = spinner();

	const config = getProjectConfig(options.cwd).match(
		(val) => val,
		(err) => program.error(color.red(err))
	);

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

	loading.start(`Fetching blocks from ${color.cyan(repoPaths.join(', '))}`);

	const resolvedRepos: gitProviders.ResolvedRepo[] = (
		await gitProviders.resolvePaths(...repoPaths)
	).match(
		(val) => val,
		({ repo, message }) => {
			loading.stop(`Failed to get info for ${color.cyan(repo)}`);
			program.error(color.red(message));
		}
	);

	const blocksMap: Map<string, RemoteBlock> = (
		await gitProviders.fetchBlocks(...resolvedRepos)
	).match(
		(val) => val,
		({ repo, message }) => {
			loading.stop(`Failed fetching blocks from ${color.cyan(repo)}`);
			program.error(color.red(message));
		}
	);

	loading.stop(`Retrieved blocks from ${color.cyan(repoPaths.join(', '))}`);

	const installedBlocks = getInstalled(blocksMap, config, options.cwd);

	const resolvedPathsResult = resolvePaths(config.paths, options.cwd);

	if (resolvedPathsResult.isErr()) {
		program.error(color.red(resolvedPathsResult.unwrapErr()));
	}

	const resolvedPaths = resolvedPathsResult.unwrap();

	for (const blockSpecifier of installedBlocks) {
		let found = false;

		for (const repo of repoPaths) {
			// we unwrap because we already checked this
			const providerInfo = (await gitProviders.getProviderInfo(repo)).unwrap();

			const fullSpecifier = `${providerInfo.name}/${providerInfo.owner}/${providerInfo.repoName}/${blockSpecifier.specifier}`;

			const block = blocksMap.get(fullSpecifier);

			if (block === undefined) continue;

			const watermark = getWatermark(context.package.version, repo);

			found = true;

			process.stdout.write(`${ascii.VERTICAL_LINE}\n`);

			process.stdout.write(`${ascii.VERTICAL_LINE}  ${fullSpecifier}\n`);

			for (const file of block.files) {
				// skip test files if not included
				if (!config.includeTests && isTestFile(file)) continue;

				process.stdout.write(`${ascii.VERTICAL_LINE}\n`);

				const sourcePath = path.join(block.directory, file);

				const response = await providerInfo.provider.fetchRaw(providerInfo, sourcePath);

				if (response.isErr()) {
					program.error(color.red(`There was an error trying to get ${fullSpecifier}`));
				}

				let remoteContent = response.unwrap();

				let directory: string;
				let prettyDirectory: string;

				if (resolvedPaths[block.category] !== undefined) {
					prettyDirectory = resolvedPaths[block.category];
					directory = path.join(options.cwd, resolvedPaths[block.category]);
				} else {
					prettyDirectory = path.join(resolvedPaths['*'], block.category);
					directory = path.join(options.cwd, resolvedPaths['*'], block.category);
				}

				let localPath = path.join(directory, file);
				let prettyLocalPath = path.join(prettyDirectory, file);
				if (block.subdirectory) {
					localPath = path.join(directory, block.name, file);
					prettyLocalPath = path.join(prettyDirectory, block.name, file);
				}

				let fileContent = '';
				if (fs.existsSync(localPath)) {
					fileContent = fs.readFileSync(localPath).toString();
				}

				if (config.watermark) {
					const lang = languages.find((lang) => lang.matches(sourcePath));

					if (lang) {
						const comment = lang.comment(watermark);

						remoteContent = `${comment}\n\n${remoteContent}`;
					}
				}

				const changes = diffLines(fileContent, remoteContent);

				const from = path.join(
					`${providerInfo.name}/${providerInfo.owner}/${providerInfo.repoName}`,
					sourcePath
				);

				const formattedDiff = formatDiff({
					from,
					to: prettyLocalPath,
					changes,
					expand: options.expand,
					maxUnchanged: options.maxUnchanged,
					colorAdded: color.greenBright,
					colorRemoved: color.redBright,
					colorCharsAdded: color.bgGreenBright,
					colorCharsRemoved: color.bgRedBright,
					prefix: () => `${ascii.VERTICAL_LINE}  `,
					onUnchanged: ({ from, to, prefix }) =>
						`${prefix?.() ?? ''}${color.cyan(from)} → ${color.gray(to)} ${color.gray('(unchanged)')}\n`,
					intro: ({ from, to, changes, prefix }) => {
						const totalChanges = changes.filter((a) => a.added).length;

						return `${prefix?.() ?? ''}${color.cyan(from)} → ${color.gray(to)} (${totalChanges} change${
							totalChanges === 1 ? '' : 's'
						})\n${prefix?.() ?? ''}\n`;
					},
				});

				process.stdout.write(formattedDiff);
			}

			break;
		}

		if (!found) {
			program.error(
				color.red(`Invalid block! ${color.bold(blockSpecifier)} does not exist!`)
			);
		}
	}
};

export { diff };
