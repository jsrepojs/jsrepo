import { intro, spinner } from '@clack/prompts';
import color from 'chalk';
import { detectSync, resolveCommand } from 'package-manager-detector';
import semver from 'semver';
import * as ascii from './ascii';
import * as lines from './blocks/utils/lines';
import { centerPad, rightPad, rightPadMin } from './blocks/utils/pad';
import { stripAsni } from './blocks/utils/strip-ansi';
import type { CLIContext } from './context';

export type Task = {
	loadingMessage: string;
	completedMessage: string;
	run: () => Promise<void>;
};

type TaskOptions = {
	verbose?: (msg: string) => void;
};

const runTasks = async (tasks: Task[], { verbose = undefined }: TaskOptions) => {
	const loading = spinner();

	for (const task of tasks) {
		if (verbose) {
			verbose(task.loadingMessage);
		} else {
			loading.start(task.loadingMessage);
		}

		try {
			await task.run();
		} catch (err) {
			loading.stop(`Error while ${task.loadingMessage}`);
			console.error(err);
		}

		if (verbose) {
			verbose(task.completedMessage);
		} else {
			loading.stop(task.completedMessage);
		}
	}
};

export type ConcurrentTask = {
	run: ({ message }: { message: (str: string) => void }) => Promise<void>;
};

export type ConcurrentOptions = {
	startMessage: string;
	stopMessage: string;
	tasks: ConcurrentTask[];
	verbose?: (msg: string) => void;
};

const runTasksConcurrently = async ({
	tasks,
	startMessage,
	stopMessage,
	verbose,
}: ConcurrentOptions) => {
	const loading = spinner();

	const message = (msg: string) => {
		if (verbose) {
			verbose(msg);
		} else {
			loading.message(msg);
		}
	};

	if (verbose) {
		verbose(startMessage);
	} else {
		loading.start(startMessage);
	}

	await Promise.all([...tasks.map((t) => t.run({ message }))]);

	if (verbose) {
		verbose(stopMessage);
	} else {
		loading.stop(stopMessage);
	}
};

const nextSteps = (steps: string[]): string => {
	let max = 20;
	steps.map((val) => {
		const reset = rightPad(stripAsni(val), 4);

		if (reset.length > max) max = reset.length;
	});

	const NEXT_STEPS = 'Next Steps';

	let result = `${ascii.VERTICAL_LINE}\n`;

	// top
	result += `${ascii.JUNCTION_RIGHT}  ${NEXT_STEPS} ${ascii.HORIZONTAL_LINE.repeat(
		max - NEXT_STEPS.length - 1
	)}${ascii.TOP_RIGHT_CORNER}\n`;

	result += `${ascii.VERTICAL_LINE} ${' '.repeat(max)} ${ascii.VERTICAL_LINE}\n`;

	steps.map((step) => {
		result += `${ascii.VERTICAL_LINE}  ${rightPadMin(step, max - 1)} ${ascii.VERTICAL_LINE}\n`;
	});

	result += `${ascii.VERTICAL_LINE} ${' '.repeat(max)} ${ascii.VERTICAL_LINE}\n`;

	// bottom
	result += `${ascii.JUNCTION_RIGHT}${ascii.HORIZONTAL_LINE.repeat(max + 2)}${ascii.BOTTOM_RIGHT_CORNER}\n`;

	return result;
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

	let max = 30;
	text.map((line) => {
		const reset = stripAsni(line);

		if (reset.length + 4 > max) max = reset.length + 4;
	});

	let result = '\n';

	// top
	result += `${ascii.TOP_LEFT_CORNER}${ascii.HORIZONTAL_LINE.repeat(max)}${ascii.TOP_RIGHT_CORNER}\n`;

	result += `${ascii.VERTICAL_LINE}${' '.repeat(max)}${ascii.VERTICAL_LINE}\n`;

	for (const line of text) {
		result += `${ascii.VERTICAL_LINE}${centerPad(line, max)}${ascii.VERTICAL_LINE}\n`;
	}

	result += `${ascii.VERTICAL_LINE}${' '.repeat(max)}${ascii.VERTICAL_LINE}\n`;

	// bottom
	result += `${ascii.BOTTOM_LEFT_CORNER}${ascii.HORIZONTAL_LINE.repeat(max)}${ascii.BOTTOM_RIGHT_CORNER}\n`;

	return lines.join(lines.get(result), { prefix: () => ' ' });
};

const _intro = ({ package: pkg }: CLIContext) => {
	console.clear();

	if (pkg.latestVersion) {
		if (semver.lt(pkg.version, pkg.latestVersion)) {
			console.info(newerVersionAvailable(pkg.name, pkg.version, pkg.latestVersion));
		}
	}

	intro(`${color.bgHex('#f7df1e').black(` ${pkg.name} `)}${color.gray(` v${pkg.version} `)}`);
};

export { runTasks, nextSteps, _intro as intro, runTasksConcurrently, truncatedList };
