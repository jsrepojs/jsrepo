import {
	intro as _intro,
	spinner as _spinner,
	cancel,
	confirm,
	isCancel,
	log,
	taskLog,
	text,
} from '@clack/prompts';
import isUnicodeSupported from 'is-unicode-supported';
import { err, ok, type Result } from 'nevereverthrow';
import type { ResolvedCommand } from 'package-manager-detector';
import path from 'pathe';
import pc from 'picocolors';
import { x } from 'tinyexec';
import pkg from '@/../package.json';
import { type AbsolutePath, type Config, DEFAULT_LANGS } from '@/api';
import { installDependencies } from '@/langs/js';
import type { RemoteDependency } from '@/utils/build';
import { searchForEnvFile, updateEnvFile } from '@/utils/env';
import { findNearestPackageJson, shouldInstall } from '@/utils/package';
import type { JsrepoError } from './errors';
import { writeFileSync } from './fs';
import { dirname, joinAbsolute } from './path';

export const isTTY = process.stdout.isTTY;

export function intro() {
	console.clear();

	_intro(`${pc.bgYellow(pc.black(` ${pkg.name} `))}${pc.gray(` v${pkg.version} `)}`);
}

function createVerboseLogger({
	options,
}: {
	options: { verbose: boolean };
}): (msg: string) => void {
	return (msg: string) => {
		if (!options.verbose) return;
		log.info(msg);
	};
}

export type Spinner = ReturnType<typeof spinner>;

/**
 * Creates a verbose logger and a spinner. We don't want to use a spinner in verbose mode because we often want to log within spinners and maintain the logs.
 *
 * @param param0
 * @returns
 */
export function initLogging({ options }: { options: { verbose: boolean } }) {
	const verbose = createVerboseLogger({ options });
	return {
		verbose,
		spinner: spinner({ verbose: options.verbose ? verbose : undefined }),
	};
}

/** A spinner compatible with verbose logging
 *
 * @param param0
 * @returns
 */
function spinner({
	verbose,
}: {
	verbose?: (msg: string) => void;
} = {}): ReturnType<typeof _spinner> {
	const loading = _spinner();

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
		get isCancelled() {
			return loading.isCancelled;
		},
	};
}

export { outro } from '@clack/prompts';

export async function promptInstallDependencies(
	dependencies: {
		dependencies: Omit<RemoteDependency, 'ecosystem'>[];
		devDependencies: Omit<RemoteDependency, 'ecosystem'>[];
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
				dependencies: dependencies.dependencies.map((dependency) => ({
					...dependency,
					ecosystem: 'js',
				})),
				devDependencies: dependencies.devDependencies.map((dependency) => ({
					...dependency,
					ecosystem: 'js',
				})),
			},
			{
				cwd: dirname(configPath as AbsolutePath),
			}
		);
	}
}

export async function promptAddEnvVars(
	neededEnvVars: Record<string, string>,
	{ options }: { options: { yes: boolean; cwd: AbsolutePath } }
): Promise<Result<Record<string, string> | undefined, JsrepoError>> {
	const envFile = searchForEnvFile(options.cwd);

	const updatedEnvVars: Record<string, string> = {};

	// we never overwrite existing values with blank values
	// we overwrite existing values with new values

	for (const [name, value] of Object.entries(neededEnvVars)) {
		// if the value is not blank and not the same as the old value then we overwrite the old value
		if (value !== '' && value !== envFile?.envVars[name]) {
			updatedEnvVars[name] = value;
			continue;
		}
		// value is blank
		// if the current value doesn't exist or is blank then we prompt the user for a value
		if (envFile?.envVars[name] === undefined || envFile?.envVars[name] === '') {
			if (!options.yes) {
				const newValue = await text({
					message: `Add a value for ${name}?`,
					initialValue: '',
					defaultValue: '',
				});

				if (isCancel(newValue)) {
					cancel('Canceled!');
					process.exit(0);
				}

				updatedEnvVars[name] = newValue;
			}
		}
	}

	if (Object.keys(updatedEnvVars).length === 0) return ok(undefined);

	const newContents = updateEnvFile(envFile?.contents ?? '', updatedEnvVars);
	const envFilePath = envFile?.path ?? joinAbsolute(options.cwd, '.env.local');
	const writeResult = writeFileSync(envFilePath, newContents);
	if (writeResult.isErr()) return err(writeResult.error);

	log.success(
		`Added environment variables to ${pc.cyan(path.relative(options.cwd, envFilePath))}`
	);

	return ok(updatedEnvVars);
}

export async function promptInstallDependenciesByEcosystem(
	neededDependencies: { dependencies: RemoteDependency[]; devDependencies: RemoteDependency[] },
	{
		options,
		config,
	}: { options: { cwd: AbsolutePath; yes: boolean }; config: Config | undefined }
): Promise<RemoteDependency[]> {
	// we can fast path the js dependencies since we support js out of the box
	const deps = shouldInstall(
		{
			dependencies: neededDependencies.dependencies.filter((dep) => dep.ecosystem === 'js'),
			devDependencies: neededDependencies.devDependencies.filter(
				(dep) => dep.ecosystem === 'js'
			),
		},
		{ pkg: findNearestPackageJson(options.cwd)?.package ?? {} }
	);
	const dependenciesByEcosystem = new Map<
		string,
		{ dependencies: RemoteDependency[]; devDependencies: RemoteDependency[] }
	>();
	for (const dep of deps.dependencies) {
		const ecosystem = dependenciesByEcosystem.get(dep.ecosystem);
		if (ecosystem) {
			ecosystem.dependencies.push(dep);
			dependenciesByEcosystem.set(dep.ecosystem, ecosystem);
		} else {
			dependenciesByEcosystem.set(dep.ecosystem, {
				dependencies: [dep],
				devDependencies: [],
			});
		}
	}
	for (const dep of deps.devDependencies) {
		const ecosystem = dependenciesByEcosystem.get(dep.ecosystem);
		if (ecosystem) {
			ecosystem.devDependencies.push(dep);
			dependenciesByEcosystem.set(dep.ecosystem, ecosystem);
		} else {
			dependenciesByEcosystem.set(dep.ecosystem, {
				dependencies: [],
				devDependencies: [dep],
			});
		}
	}

	const languages = config?.languages ?? DEFAULT_LANGS;

	if (dependenciesByEcosystem.size === 0) return [];

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
		for (const [ecosystem, dependencies] of dependenciesByEcosystem) {
			await languages
				.find((lang) => lang.canInstallDependencies(ecosystem))
				?.installDependencies(dependencies, {
					cwd: options.cwd,
				});
		}
	}

	return Array.from(dependenciesByEcosystem.values()).flatMap((v) => [
		...v.dependencies,
		...v.devDependencies,
	]);
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
