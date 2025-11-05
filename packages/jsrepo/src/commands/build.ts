import fs from 'node:fs';
import { Command } from 'commander';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import { z } from 'zod';
import {
	commonOptions,
	defaultCommandOptionsSchema,
	error,
	forEachRegistry,
	hasRegistries,
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import {
	type BuildResult,
	getItemBasePath,
	resolveFiles,
	resolveRegistryItems,
	type UnresolvedFile,
	validateRegistryConfig,
} from '@/utils/build';
import type { Config } from '@/utils/config';
import { loadConfig, loadConfigSearch } from '@/utils/config/utils';
import {
	type BuildError,
	type CLIError,
	ConfigNotFoundError,
	NoOutputsError,
	NoRegistriesError,
} from '@/utils/errors';
import { intro, isTTY, outro } from '@/utils/prompts';
import { debounced } from '@/utils/utils';

export const schema = defaultCommandOptionsSchema.extend({
	watch: z.boolean(),
	debounce: z.number(),
});

export type BuildOptions = z.infer<typeof schema>;

export const build = new Command('build')
	.description('Build your registry.')
	.addOption(commonOptions.cwd)
	.option('-w, --watch', 'Watch for changes and rebuild automatically', false)
	.option(
		'-d, --debounce <ms>',
		'How long to wait before building again after a change is detected (watch mode only)',
		(val) => Number.parseInt(val, 10),
		100
	)
	.action(async (rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: false,
		});
		if (!configResult) error(new ConfigNotFoundError(options.cwd));

		if (options.watch) {
			await runWatch(options, configResult);
		} else {
			intro();

			const result = await tryCommand(
				runBuild(
					// this way if the config is found in a higher directory we base everything off of that directory
					{
						...options,
						cwd: configResult ? path.dirname(configResult.path) : options.cwd,
					},
					configResult.config
				)
			);
			outro(formatResult(result, { type: 'build' }));
		}
	});

export type RegistryBuildResult = {
	time: number;
	name: string;
	items: number;
	files: number;
	outputs: number;
};

export type BuildCommandResult = {
	results: Result<RegistryBuildResult, BuildError>[];
	duration: number;
};

export async function runBuild(
	options: BuildOptions,
	config: Config
): Promise<Result<BuildCommandResult, CLIError>> {
	if (!hasRegistries(config)) return err(new NoRegistriesError());

	const start = performance.now();
	const results = await forEachRegistry<Result<RegistryBuildResult, BuildError>>(
		config,
		async (registry) => {
			registry.outputs = registry.outputs ?? [];

			const start = performance.now();

			const result = await validateRegistryConfig(registry);
			if (result.isErr()) return err(result.error);

			if (registry.outputs.length > 0) {
				await Promise.all(
					registry.outputs.map((output) => output.clean({ cwd: options.cwd }))
				);
			}

			// start by resolving all the files so we know where stuff is
			const files = registry.items.flatMap((item) =>
				item.files.map((file) => {
					const basePath = getItemBasePath(item);
					return {
						...file,
						parent: {
							name: item.name,
							type: item.type,
							basePath: basePath ?? '',
						},
					} satisfies UnresolvedFile;
				})
			);
			const resolvedFilesResult = await resolveFiles(files, {
				cwd: options.cwd,
				config,
				registry,
			});
			if (resolvedFilesResult.isErr()) return err(resolvedFilesResult.error);
			const resolvedFiles = resolvedFilesResult.value;

			// now we resolve registry items

			const resolvedItemsResult = await resolveRegistryItems(registry.items, {
				cwd: options.cwd,
				resolvedFiles,
				registryName: registry.name,
			});
			if (resolvedItemsResult.isErr()) return err(resolvedItemsResult.error);
			const resolvedItems = resolvedItemsResult.value;

			const buildResult: BuildResult = {
				// we spread here so that users are allowed to supply additional props and they can be passed through to a custom output
				...registry,
				items: Array.from(resolvedItems.values()),
				defaultPaths: registry.defaultPaths as Record<string, string> | undefined,
			};

			if (registry.outputs.length === 0)
				return err(new NoOutputsError({ registryName: registry.name }));

			await Promise.all(
				registry.outputs.map((output) => output.output(buildResult, { cwd: options.cwd }))
			);

			const end = performance.now();
			const duration = end - start;

			return ok({
				name: registry.name,
				time: duration,
				items: resolvedItems.size,
				files: resolvedFiles.size,
				outputs: registry.outputs.length,
			});
		},
		{ cwd: options.cwd }
	);

	const end = performance.now();
	const duration = end - start;

	return ok({ results, duration });
}

async function runWatch(
	options: BuildOptions,
	configResult: { config: Config; path: string }
): Promise<void> {
	let currentConfig: Config = configResult.config;

	const ac = new AbortController();

	const watchers = new Map<string, fs.FSWatcher>();

	let buildActive = true;

	const clearLine = () => {
		if (isTTY) {
			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);
		}
	};

	const writeStatus = (message: string, newLine = false) => {
		if (isTTY) {
			clearLine();
			process.stdout.write(message);
		} else if (newLine) {
			process.stdout.write(`${message}\n`);
		}
	};

	const debouncedBuild = debounced(
		async ({ options, config }: { options: BuildOptions; config: Config }) => {
			if (buildActive) return;
			buildActive = true;

			writeStatus(pc.dim(`Building...`));

			const buildResult = await runBuild(options, config);

			clearLine();

			if (buildResult.isErr()) {
				process.stdout.write(
					`Error building registry: ${pc.red(buildResult.error.message)}\n`
				);
			} else {
				process.stdout.write(`${formatResult(buildResult.value, { type: 'build' })}\n`);
			}

			writeStatus(pc.dim(`${isTTY ? '\n' : ''}Watching for changes...`));

			buildActive = false;
		},
		options.debounce
	);

	watchers.set(
		configResult.path,
		createWatcher(configResult.path, {
			signal: ac.signal,
			onChange: async () => {
				const result = await loadConfig({
					cwd: path.dirname(configResult.path),
				});
				if (result.isErr()) return;
				currentConfig = result.value;
				await setupWatchers();
				debouncedBuild({ options, config: currentConfig });
			},
		})
	);

	async function setupWatchers() {
		await forEachRegistry(
			configResult.config,
			async (registry) => {
				const files = registry.items.flatMap((item) =>
					item.files.map((file) => path.join(options.cwd, file.path))
				);
				for (const file of files) {
					if (watchers.has(file)) continue;
					watchers.set(
						file,
						createWatcher(file, {
							signal: ac.signal,
							onChange: () => debouncedBuild({ options, config: currentConfig }),
						})
					);
				}
			},
			{ cwd: options.cwd }
		);
	}

	setupWatchers();

	writeStatus(`Building...`, true);

	const buildResult = await runBuild(options, configResult.config);

	clearLine();

	if (buildResult.isErr()) {
		process.stdout.write(`Error building registry: ${pc.red(buildResult.error.message)}\n`);
	} else {
		process.stdout.write(`${formatResult(buildResult.value, { type: 'build' })}\n`);
	}

	writeStatus(pc.dim(`${isTTY ? '\n' : ''}Watching for changes...`));

	buildActive = false;

	process.on('SIGINT', () => {
		ac.abort();
	});
	process.on('SIGTERM', () => {
		ac.abort();
	});
}

function createWatcher(
	path: string,
	{ onChange, signal }: { onChange?: () => void; signal: AbortSignal }
) {
	return fs.watch(path, { recursive: true, signal }, (eventType) => {
		if (eventType === 'change') {
			onChange?.();
		}
	});
}

function formatResult(
	{ results, duration }: BuildCommandResult,
	{ type }: { type: 'build' | 'watch' }
): string {
	return `${type === 'build' ? 'Finished' : 'Rebuilt'} in ${pc.green(`${duration.toFixed(2)}ms`)}
${results.map((result) => `   ${formatRegistryResult(result)}`).join('\n')}`;
}

function formatRegistryResult(result: Result<RegistryBuildResult, BuildError>): string {
	if (result.isErr())
		return `${pc.cyan(result.error.registryName)}: ${pc.red(result.error.toString())}`;
	const { name, outputs, time, items, files } = result.value;

	return `${pc.cyan(name)}: Created ${pc.green(outputs.toString())} ${
		outputs > 1 ? 'outputs' : 'output'
	} in ${pc.green(`${time.toFixed(2)}ms`)} with ${pc.green(items.toString())} ${
		items > 1 ? 'items' : 'item'
	} and ${pc.green(files.toString())} ${files > 1 ? 'files' : 'file'}.`;
}
