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

export type ConfigAddTransformOptions = z.infer<typeof schema>;

export const transform = new Command('transform')
	.description('Add a transform to your config.')
	.argument(
		'[transforms...]',
		'Names of the transforms you want to add to your config. ex: (@jsrepo/transform-prettier, @jsrepo/transform-biome)'
	)
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.yes)
	.action(async (transforms, rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		intro();

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: !options.yes,
		});
		if (!configResult) error(new ConfigNotFoundError(options.cwd));

		const result = await tryCommand(
			runTransform(
				transforms,
				// this way if the config is found in a higher directory we base everything off of that directory
				{ ...options, cwd: configResult ? path.dirname(configResult.path) : options.cwd },
				configResult
			)
		);

		outro(formatResult(result));
	});

export type ConfigAddTransformCommandResult = {
	duration: number;
	transforms: number;
};

export async function runTransform(
	transformsArg: string[],
	options: ConfigAddTransformOptions,
	config: { config: Config; path: string }
): Promise<Result<ConfigAddTransformCommandResult, CLIError>> {
	const start = performance.now();

	const transformsResult = parsePlugins(transformsArg, 'transform');
	if (transformsResult.isErr()) return err(transformsResult.error);
	const transforms = transformsResult.value;

	const code = fs.readFileSync(config.path, 'utf-8');

	const newCodeResult = await addPluginsToConfig({
		plugins: transforms,
		key: 'transforms',
		config: { path: config.path, code },
	});
	if (newCodeResult.isErr()) return err(newCodeResult.error);
	const newCode = newCodeResult.value;

	fs.writeFileSync(config.path, newCode);

	await promptInstallDependencies(
		{ devDependencies: transforms, dependencies: [] },
		{ options, configPath: config.path }
	);

	const end = performance.now();
	const duration = end - start;

	return ok({ duration, transforms: transformsArg.length });
}

export function formatResult({
	duration,
	transforms: items,
}: ConfigAddTransformCommandResult): string {
	return `Added ${pc.green(items.toString())} ${items > 1 ? 'transforms' : 'transform'} in ${pc.green(
		`${duration.toFixed(2)}ms`
	)}.`;
}
