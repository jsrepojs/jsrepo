import { intro, spinner } from '@clack/prompts';
import boxen from 'boxen';
import color from 'chalk';
import { detectSync, resolveCommand } from 'package-manager-detector';
import semver from 'semver';
import * as ascii from './ascii';
import { stripAsni } from './blocks/ts/strip-ansi';
import { packageJson } from './context';
import { getLatestVersion } from './get-latest-version';

export type Task = {
	loadingMessage: string;
	completedMessage: string;
	run: () => Promise<void>;
};

type TaskOptions = {
	loading: ReturnType<typeof spinner>;
};

const runTasks = async (tasks: Task[], { loading }: TaskOptions) => {
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

const runTasksConcurrently = async ({
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

const nextSteps = (steps: string[]): string => {
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

const truncatedList = (items: string[], maxLength = 3) => {
	const truncated = items.slice(0, maxLength);

	const remaining = items.length - truncated.length;

	return `${truncated.join(', ')}${remaining > 0 ? ` and ${remaining} other(s)` : ''}`;
};

const newerVersionAvailable = (name: string, oldVersion: string, newVersion: string) => {
	const pm = detectSync({ cwd: process.cwd() })?.agent ?? 'npm';

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
				newerVersionAvailable(packageJson.name, packageJson.version, latestVersion.unwrap())
			);
		}
	}

	intro(
		`${color.bgHex('#f7df1e').black(` ${packageJson.name} `)}${color.gray(` v${packageJson.version} `)}`
	);
};

export {
	runTasks,
	nextSteps,
	_intro as intro,
	_spinner as spinner,
	runTasksConcurrently,
	truncatedList,
};
