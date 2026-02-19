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

export type ConfigAddProviderOptions = z.infer<typeof schema>;

export const provider = new Command('provider')
	.description('Add a provider to your config.')
	.argument(
		'[providers...]',
		'Names of the providers you want to add to your config. ex: (jsrepo-provider-jsr, jsrepo-provider-npm)'
	)
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.yes)
	.action(async (providers, rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: !options.yes,
		});

		if (!configResult) error(new ConfigNotFoundError(options.cwd));

		const config = configResult.config;
		const cwd = path.dirname(configResult.path) as AbsolutePath;
		const providerOptions = { ...options, cwd };

		await runBeforeHooks(
			config,
			{ command: 'config.provider', options: providerOptions },
			{ cwd, yes: options.yes }
		);

		intro();

		const result = await tryCommand(runProvider(providers, providerOptions, configResult));

		outro(formatResult(result));

		await runAfterHooks(
			config,
			{ command: 'config.provider', options: providerOptions, result },
			{ cwd }
		);
	});

export type ConfigAddProviderCommandResult = {
	duration: number;
	providers: number;
};

export async function runProvider(
	providersArg: string[],
	options: ConfigAddProviderOptions,
	config: { config: Config; path: AbsolutePath }
): Promise<Result<ConfigAddProviderCommandResult, CLIError>> {
	const start = performance.now();

	const providersResult = parsePlugins(providersArg, 'provider');
	if (providersResult.isErr()) return err(providersResult.error);
	const providers = providersResult.value;

	const codeResult = readFileSync(config.path);
	if (codeResult.isErr()) return err(codeResult.error);
	const code = codeResult.value;

	const newCodeResult = await addPluginsToConfig({
		plugins: providers,
		key: 'providers',
		config: { path: config.path, code },
	});
	if (newCodeResult.isErr()) return err(newCodeResult.error);
	const newCode = newCodeResult.value;

	const writeResult = writeFileSync(config.path, newCode);
	if (writeResult.isErr()) return err(writeResult.error);

	await promptInstallDependencies(
		{
			devDependencies: providers.map((provider) => ({
				name: provider.packageName,
				version: provider.version,
			})),
			dependencies: [],
		},
		{ options, configPath: config.path }
	);

	const end = performance.now();
	const duration = end - start;

	return ok({ duration, providers: providersArg.length });
}

export function formatResult({ duration, providers }: ConfigAddProviderCommandResult): string {
	return `Added ${pc.green(providers.toString())} ${providers > 1 ? 'providers' : 'provider'} in ${pc.green(
		`${duration.toFixed(2)}ms`
	)}.`;
}
