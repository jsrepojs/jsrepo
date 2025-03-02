import { stripVTControlCharacters as stripAsni } from 'node:util';
import type { PartialConfiguration } from '@biomejs/wasm-nodejs';
import { cancel, confirm, intro, isCancel, log, select, spinner, text } from '@clack/prompts';
import boxen from 'boxen';
import color from 'chalk';
import { program } from 'commander';
import { diffLines } from 'diff';
import { type Agent, detect, resolveCommand } from 'package-manager-detector';
import type * as prettier from 'prettier';
import semver from 'semver';
import { cursor, erase } from 'sisteransi';
import { type Message, type ModelName, models } from './ai';
import * as ascii from './ascii';
import type { ProjectConfig } from './config';
import { packageJson } from './context';
import { installDependencies } from './dependencies';
import { formatDiff } from './diff';
import { formatFile } from './files';
import { getLatestVersion } from './get-latest-version';
import { returnShouldInstall } from './package';
import * as persisted from './persisted';

export type Task = {
	loadingMessage: string;
	completedMessage: string;
	run: () => Promise<void>;
};

type TaskOptions = {
	loading: ReturnType<typeof spinner>;
};

export const runTasks = async (tasks: Task[], { loading }: TaskOptions) => {
	for (const task of tasks) {
		loading.start(task.loadingMessage);

		try {
			await task.run();
		} catch (err) {
			loading.stop(`Error while ${task.loadingMessage}`);
			console.error(err);
		}

		loading.stop(task.completedMessage);
	}
};

export type ConcurrentTask = {
	run: ({ message }: { message: (str: string) => void }) => Promise<void>;
};

export type ConcurrentOptions = {
	loading: ReturnType<typeof spinner>;
	startMessage: string;
	stopMessage: string;
	tasks: ConcurrentTask[];
};

export const runTasksConcurrently = async ({
	tasks,
	startMessage,
	stopMessage,
	loading,
}: ConcurrentOptions) => {
	loading.start(startMessage);

	await Promise.all([...tasks.map((t) => t.run({ message: loading.message }))]);

	loading.stop(stopMessage);
};

/** A spinner compatible with verbose logging
 *
 * @param param0
 * @returns
 */
const _spinner = ({
	verbose,
}: { verbose?: (msg: string) => void } = {}): ReturnType<typeof spinner> => {
	const loading = spinner();

	return {
		message: (msg) => {
			if (verbose) {
				verbose(msg ?? '');
			} else {
				loading.message(msg);
			}
		},
		stop: (msg) => {
			if (verbose) {
				verbose(msg ?? '');
			} else {
				loading.stop(msg);
			}
		},
		start: (msg) => {
			if (verbose) {
				verbose(msg ?? '');
			} else {
				loading.start(msg);
			}
		},
	};
};

export const nextSteps = (steps: string[]): string => {
	const box = boxen(steps.join('\n'), {
		title: 'Next Steps',
		textAlignment: 'left',
		padding: 1,
		borderColor: 'gray',
		borderStyle: {
			topLeft: stripAsni(ascii.JUNCTION_RIGHT),
			bottomLeft: stripAsni(ascii.JUNCTION_RIGHT),
			topRight: stripAsni(ascii.TOP_RIGHT_CORNER),
			top: stripAsni(ascii.HORIZONTAL_LINE),
			bottom: stripAsni(ascii.HORIZONTAL_LINE),
			bottomRight: stripAsni(ascii.BOTTOM_RIGHT_CORNER),
			left: stripAsni(ascii.VERTICAL_LINE),
			right: stripAsni(ascii.VERTICAL_LINE),
		},
	});

	return `${ascii.VERTICAL_LINE}\n${box}\n`;
};

export const truncatedList = (items: string[], maxLength = 3) => {
	const truncated = items.slice(0, maxLength);

	const remaining = items.length - truncated.length;

	return `${truncated.join(', ')}${remaining > 0 ? ` and ${remaining} other(s)` : ''}`;
};

const newerVersionAvailable = async (name: string, oldVersion: string, newVersion: string) => {
	const pm = (await detect({ cwd: process.cwd() }))?.agent ?? 'npm';

	const installCommand = resolveCommand(pm, 'global', ['jsrepo@latest']);

	const text: string[] = [
		`Update available! ${color.redBright(oldVersion)} -> ${color.greenBright(newVersion)}`,
		`${color.cyan('Changelog')}: https://github.com/ieedan/jsrepo/releases/tag/${name}@${newVersion}`,
		`Run ${color.cyan(`${installCommand?.command} ${installCommand?.args.join(' ')}`)} to update!`,
		'',
		`${color.yellowBright('Star')} on GitHub for updates: https://github.com/ieedan/jsrepo`,
	];

	const box = boxen(text.join('\n'), {
		borderColor: 'gray',
		padding: 1,
		margin: 1,
		textAlignment: 'center',
	});

	return box;
};

const _intro = async () => {
	console.clear();

	const latestVersion = await getLatestVersion();

	if (latestVersion.isOk()) {
		if (semver.lt(packageJson.version, latestVersion.unwrap())) {
			console.info(
				await newerVersionAvailable(packageJson.name, packageJson.version, latestVersion.unwrap())
			);
		}
	}

	intro(
		`${color.bgHex('#f7df1e').black(` ${packageJson.name} `)}${color.gray(` v${packageJson.version} `)}`
	);
};

type UpdateBlockOptions = {
	incoming: {
		content: string;
		path: string;
	};
	current: {
		content: string;
		path: string;
	};
	config: {
		formatter: ProjectConfig['formatter'];
		prettierOptions: prettier.Options | null;
		biomeOptions: PartialConfiguration | null;
	};
	options: {
		yes: boolean;
		no: boolean;
		expand: boolean;
		maxUnchanged: number;
		verbose?: (msg: string) => void;
		loading: ReturnType<typeof spinner>;
	};
};

type UpdateBlockResult =
	| {
			applyChanges: true;
			updatedContent: string;
	  }
	| {
			applyChanges: false;
	  };

const MODEL_PREFERENCE_KEY = 'model-preference';

export const promptUpdateFile = async ({
	incoming,
	current,
	config,
	options,
}: UpdateBlockOptions): Promise<UpdateBlockResult> => {
	const storage = persisted.get();

	process.stdout.write(`${ascii.VERTICAL_LINE}\n`);

	let acceptedChanges = false;

	let updatedContent = incoming.content;

	let model: ModelName = storage.get(MODEL_PREFERENCE_KEY, 'Claude 3.5 Sonnet') as ModelName;

	let messageHistory: Message[] = [];

	while (true) {
		const changes = diffLines(current.content, updatedContent);

		// print diff
		const formattedDiff = formatDiff({
			from: incoming.path,
			to: current.path,
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
		if (changes.length > 1 || current.content === '') {
			acceptedChanges = options.yes;

			if (!options.yes && !options.no) {
				const confirmOptions = [
					{
						label: 'Accept',
						value: 'accept',
					},
					{
						label: 'Reject',
						value: 'reject',
					},
				];

				if (messageHistory.length > 0) {
					confirmOptions.push(
						{
							label: `✨ ${color.yellow('Update with AI')} ✨ ${color.gray('(Iterate)')}`,
							value: 'update-iterate',
						},
						{
							label: `✨ ${color.yellow('Update with AI')} ✨ ${color.gray('(Start over)')}`,
							value: 'update',
						}
					);
				} else {
					confirmOptions.push({
						label: `✨ ${color.yellow('Update with AI')} ✨`,
						value: 'update',
					});
				}

				// prompt the user
				const confirmResult = await select({
					message: 'Accept changes?',
					options: confirmOptions,
				});

				if (isCancel(confirmResult)) {
					cancel('Canceled!');
					process.exit(0);
				}

				if (confirmResult === 'update' || confirmResult === 'update-iterate') {
					// clear chat context
					if (confirmResult === 'update') {
						messageHistory = [];
					}

					// prompt for model
					const modelResult = await select({
						message: 'Select a model',
						options: Object.keys(models).map((key) => ({
							label: key,
							value: key,
						})),
						initialValue: model,
					});

					if (isCancel(modelResult)) {
						cancel('Canceled!');
						process.exit(0);
					}

					if (modelResult !== model) {
						storage.set(MODEL_PREFERENCE_KEY, modelResult);
					}

					model = modelResult as ModelName;

					const additionalInstructions = await text({
						message: 'Additional instructions:',
						defaultValue: 'None',
						validate: (val) => {
							// don't care if no messages have been sent
							if (messageHistory.length === 0) return undefined;

							if (val.trim() === '') {
								return 'Please provide additional context so that I know how I can improve.';
							}
						},
					});

					if (isCancel(additionalInstructions)) {
						cancel('Canceled!');
						process.exit(0);
					}

					try {
						const { content, prompt } = await models[model].updateFile({
							originalFile: current,
							newFile: {
								content:
									confirmResult === 'update-iterate'
										? updatedContent
										: incoming.content,
								path: incoming.path,
							},
							additionalInstructions:
								additionalInstructions !== 'None'
									? additionalInstructions
									: undefined,
							loading: options.loading,
							verbose: options.verbose,
							messages: messageHistory,
						});

						updatedContent = content;

						// add messages to history
						messageHistory.push({ role: 'user', content: prompt });
						messageHistory.push({ role: 'assistant', content: content });
					} catch (err) {
						options.loading.stop();
						log.error(color.red(`Error getting completions: ${err}`));
						process.stdout.write(`${ascii.VERTICAL_LINE}\n`);
						continue;
					}

					updatedContent = await formatFile({
						file: {
							content: updatedContent,
							destPath: current.path,
						},
						biomeOptions: config.biomeOptions,
						prettierOptions: config.prettierOptions,
						formatter: config.formatter,
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

	if (acceptedChanges) {
		return { applyChanges: true, updatedContent };
	}

	return { applyChanges: false };
};

type InstallDependenciesOptions = {
	yes: boolean;
	no?: boolean;
	cwd: string;
	pm: Agent;
	ignoreWorkspace?: boolean;
};

type InstallDependenciesResult = {
	/** True if dependencies were installed */
	installed: boolean;
	dependencies: Set<string>;
	devDependencies: Set<string>;
};

export const promptInstallDependencies = async (
	deps: Set<string>,
	devDeps: Set<string>,
	{ yes, no = false, cwd, pm, ignoreWorkspace = false }: InstallDependenciesOptions
): Promise<InstallDependenciesResult> => {
	// check if dependencies are already installed
	const { dependencies, devDependencies } = returnShouldInstall(deps, devDeps, { cwd });

	const hasDependencies = dependencies.size > 0 || devDependencies.size > 0;

	if (hasDependencies) {
		let install = yes;
		if (!yes && !no) {
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
			if (dependencies.size > 0) {
				await installDependencies({
					pm,
					deps: Array.from(dependencies),
					dev: false,
					cwd,
					ignoreWorkspace,
				});
			}

			if (devDependencies.size > 0) {
				await installDependencies({
					pm,
					deps: Array.from(devDependencies),
					dev: false,
					cwd,
					ignoreWorkspace,
				});
			}

			return { installed: true, dependencies, devDependencies };
		}
	}

	return { installed: false, dependencies, devDependencies };
};

// From sveltejs/cli https://github.com/sveltejs/cli/blob/main/packages/clack-prompts/index.ts#L606
export const taskLog = (title: string) => {
	const BAR = color.dim(ascii.VERTICAL_LINE);
	const ACTIVE = color.green(ascii.S_STEP_ACTIVE);
	const SUCCESS = color.green(ascii.S_SUCCESS);
	const ERROR = color.red(ascii.S_ERROR);

	// heading
	process.stdout.write(`${BAR}\n`);
	process.stdout.write(`${ACTIVE}  ${title}\n`);

	let output = '';
	let frame = '';

	// clears previous output
	const clear = (eraseTitle = false): void => {
		if (!frame) return;
		const terminalWidth = process.stdout.columns;
		const frameHeight = frame.split('\n').reduce((height, line) => {
			// accounts for line wraps
			return height + Math.ceil(line.length / terminalWidth);
		}, 0);
		const lines = frameHeight + (eraseTitle ? 1 : 0);

		process.stdout.write(cursor.up(lines));
		process.stdout.write(erase.down());
	};

	// logs the output
	const print = (limit = 0): void => {
		const lines = output.split('\n').slice(-limit);
		// reset frame
		frame = '';
		for (const line of lines) {
			frame += `${BAR}  ${line}\n`;
		}
		process.stdout.write(color.dim(frame));
	};

	return {
		set text(data: string) {
			clear();
			output += data;
			// half the height of the terminal
			const frameHeight = Math.ceil(process.stdout.rows / 2);
			print(frameHeight);
		},
		fail(message: string): void {
			clear(true);
			process.stdout.write(`${ERROR}  ${message}\n`);
			print(); // log the output on failure
		},
		success(message: string): void {
			clear(true);
			process.stdout.write(`${SUCCESS}  ${message}\n`);
		},
	};
};

export { _intro as intro, _spinner as spinner };
