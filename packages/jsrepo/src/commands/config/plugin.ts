import { Command } from 'commander';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import { z } from 'zod';
import {
	commonOptions,
	defaultCommandOptionsSchema,
	error,
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import type { Config } from '@/utils/config';
import { addPluginsToConfig, parsePlugins } from '@/utils/config/mods/add-plugins';
import { loadConfigSearch } from '@/utils/config/utils';
import { type CLIError, ConfigNotFoundError } from '@/utils/errors';
import { readFileSync, writeFileSync } from '@/utils/fs';
import { runAfterHooks, runBeforeHooks } from '@/utils/hooks';
import { intro, outro, promptInstallDependencies } from '@/utils/prompts';
import type { AbsolutePath } from '@/utils/types';

export const schema = defaultCommandOptionsSchema.extend({
	yes: z.boolean(),
});

export type ConfigAddPluginOptions = z.infer<typeof schema>;

export const plugin = new Command('plugin')
	.description('Add a plugin to your config.')
	.argument(
		'[plugins...]',
		'Names of the plugins you want to add to your config. ex: (@jsrepo/transform-prettier, @jsrepo/shadcn)'
	)
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.yes)
	.action(async (pluginsArg, rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: !options.yes,
		});
		if (!configResult) error(new ConfigNotFoundError(options.cwd));

		const config = configResult.config;
		const cwd = path.dirname(configResult.path) as AbsolutePath;
		const pluginOptions = { ...options, cwd };

		await runBeforeHooks(
			config,
			{ command: 'config.plugin', options: pluginOptions },
			{ cwd, yes: options.yes }
		);

		intro();

		const result = await tryCommand(runPlugin(pluginsArg, pluginOptions, configResult));

		outro(formatResult(result));

		await runAfterHooks(
			config,
			{ command: 'config.plugin', options: pluginOptions, result },
			{ cwd }
		);
	});

export type ConfigAddPluginCommandResult = {
	duration: number;
	plugins: number;
};

export async function runPlugin(
	pluginsArg: string[],
	options: ConfigAddPluginOptions,
	config: { config: Config; path: AbsolutePath }
): Promise<Result<ConfigAddPluginCommandResult, CLIError>> {
	const start = performance.now();

	const pluginsResult = parsePlugins(pluginsArg, 'plugin');
	if (pluginsResult.isErr()) return err(pluginsResult.error);
	const plugins = pluginsResult.value;

	const codeResult = readFileSync(config.path);
	if (codeResult.isErr()) return err(codeResult.error);
	const code = codeResult.value;

	const newCodeResult = await addPluginsToConfig({
		plugins,
		key: 'plugins',
		config: { path: config.path, code },
	});
	if (newCodeResult.isErr()) return err(newCodeResult.error);
	const newCode = newCodeResult.value;

	const writeResult = writeFileSync(config.path, newCode);
	if (writeResult.isErr()) return err(writeResult.error);

	await promptInstallDependencies(
		{
			devDependencies: plugins.map((plugin) => ({
				name: plugin.packageName,
				version: plugin.version,
			})),
			dependencies: [],
		},
		{ options, configPath: config.path }
	);

	const end = performance.now();
	const duration = end - start;

	return ok({ duration, plugins: pluginsArg.length });
}

export function formatResult({
	duration,
	plugins: items,
}: ConfigAddPluginCommandResult): string {
	return `Added ${pc.green(items.toString())} ${items > 1 ? 'plugins' : 'plugin'} in ${pc.green(
		`${duration.toFixed(2)}ms`
	)}.`;
}
