import { intro as _intro, cancel, confirm, isCancel, taskLog } from '@clack/prompts';
import isUnicodeSupported from 'is-unicode-supported';
import { detect, type ResolvedCommand, resolveCommand } from 'package-manager-detector';
import pc from 'picocolors';
import { x } from 'tinyexec';
import pkg from '@/../package.json';
import { findNearestPackageJson, shouldInstall } from '@/utils/package';
import type { AbsolutePath } from '@/utils/types';
import { dirname } from './path';

export const isTTY = process.stdout.isTTY;

export function intro() {
	console.clear();

	_intro(`${pc.bgYellow(pc.black(` ${pkg.name} `))}${pc.gray(` v${pkg.version} `)}`);
}

export { outro } from '@clack/prompts';

export async function promptInstallDependencies(
	dependencies: {
		dependencies: string[];
		devDependencies: string[];
	},
	{ options, configPath }: { options: { yes: boolean }; configPath: string }
) {
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
		await installDependencies(
			{
				dependencies: dependencies.dependencies,
				devDependencies: dependencies.devDependencies,
			},
			{
				cwd: dirname(configPath as AbsolutePath),
			}
		);
	}
}

export async function runCommands({
	title,
	commands,
	cwd,
	messages,
}: {
	title: string;
	commands: ResolvedCommand[];
	cwd: string;
	messages: {
		success: () => string;
		error: (err: unknown) => string;
	};
}) {
	const task = taskLog({
		title,
		limit: Math.ceil(process.stdout.rows / 2),
		spacing: 0,
		retainLog: true,
	});

	const runCmd = async (cmd: ResolvedCommand) => {
		const proc = x(cmd.command, [...cmd.args], { nodeOptions: { cwd } });

		for await (const line of proc) {
			task.message(line);
		}
	};

	try {
		for (const command of commands) {
			await runCmd(command);
		}

		task.success(messages.success());
	} catch (err) {
		task.error(messages.error(err));
		process.exit(1);
	}
}

const unicode = isUnicodeSupported();

const s = (c: string, fallback: string) => (unicode ? c : fallback);

export const VERTICAL_LINE = pc.gray(s('│', '|'));

export async function installDependencies(
	dependencies: { dependencies: string[]; devDependencies: string[] },
	{ cwd }: { cwd: AbsolutePath }
): Promise<void> {
	const packageResult = findNearestPackageJson(cwd);
	if (!packageResult) return;
	const pm = (await detect({ cwd }))?.agent ?? 'npm';

	// this is only if no dependencies were provided
	if (dependencies.dependencies.length === 0 && dependencies.devDependencies.length === 0) {
		const installCmd = resolveCommand(pm, 'install', []);

		if (installCmd === null) return;

		await runCommands({
			title: `Installing dependencies with ${pm}...`,
			commands: [installCmd],
			cwd,
			messages: {
				success: () => `Installed dependencies`,
				error: (err) =>
					`Failed to install dependencies: ${err instanceof Error ? err.message : err}`,
			},
		});
		return;
	}

	const { dependencies: deps, devDependencies: devDeps } = shouldInstall(dependencies, {
		pkg: packageResult.package,
	});

	if (deps.length === 0 && devDeps.length === 0) return;

	const add = resolveCommand(pm, 'add', [...deps]);
	const addDev = resolveCommand(pm, 'add', ['-D', ...devDeps]);

	await runCommands({
		title: `Installing dependencies with ${pm}...`,
		commands: [
			...(add && deps.length > 0 ? [add] : []),
			...(addDev && devDeps.length > 0 ? [addDev] : []),
		],
		cwd,
		messages: {
			success: () => `Installed ${pc.cyan([...deps, ...devDeps].join(', '))}`,
			error: (err) =>
				`Failed to install dependencies: ${err instanceof Error ? err.message : err}`,
		},
	});
}
