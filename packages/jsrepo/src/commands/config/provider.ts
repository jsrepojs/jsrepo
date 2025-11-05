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
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import type { Config } from '@/utils/config';
import { addPluginsToConfig, parsePlugins } from '@/utils/config/mods/add-plugins';
import { loadConfigSearch } from '@/utils/config/utils';
import { type CLIError, ConfigNotFoundError } from '@/utils/errors';
import { intro, outro, promptInstallDependencies } from '@/utils/prompts';

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

		intro();

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: !options.yes,
		});

		if (!configResult) error(new ConfigNotFoundError(options.cwd));

		const result = await tryCommand(
			runProvider(
				providers,
				// this way if the config is found in a higher directory we base everything off of that directory
				{ ...options, cwd: configResult ? path.dirname(configResult.path) : options.cwd },
				configResult
			)
		);

		outro(formatResult(result));
	});

export type ConfigAddProviderCommandResult = {
	duration: number;
	providers: number;
};

export async function runProvider(
	providersArg: string[],
	options: ConfigAddProviderOptions,
	config: { config: Config; path: string }
): Promise<Result<ConfigAddProviderCommandResult, CLIError>> {
	const start = performance.now();

	const providersResult = parsePlugins(providersArg, 'provider');
	if (providersResult.isErr()) return err(providersResult.error);
	const providers = providersResult.value;

	const code = fs.readFileSync(config.path, 'utf-8');

	const newCodeResult = await addPluginsToConfig({
		plugins: providers,
		key: 'providers',
		config: { path: config.path, code },
	});
	if (newCodeResult.isErr()) return err(newCodeResult.error);
	const newCode = newCodeResult.value;

	fs.writeFileSync(config.path, newCode);

	await promptInstallDependencies(providers, { options, configPath: config.path });

	const end = performance.now();
	const duration = end - start;

	return ok({ duration, providers: providersArg.length });
}

export function formatResult({ duration, providers }: ConfigAddProviderCommandResult): string {
	return `Added ${pc.green(providers.toString())} ${providers > 1 ? 'providers' : 'provider'} in ${pc.green(
		`${duration.toFixed(2)}ms`
	)}.`;
}
