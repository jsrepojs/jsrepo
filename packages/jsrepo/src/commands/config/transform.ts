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
import { runAfterHooksWithLog, runBeforeHooksWithBail } from '@/utils/hooks';
import { intro, outro, promptInstallDependencies } from '@/utils/prompts';
import type { AbsolutePath } from '@/utils/types';

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

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: !options.yes,
		});
		if (!configResult) error(new ConfigNotFoundError(options.cwd));

		const config = configResult.config;
		const cwd = path.dirname(configResult.path) as AbsolutePath;
		const transformOptions = { ...options, cwd };

		await runBeforeHooksWithBail(
			config,
			{ command: 'config.transform', options: transformOptions },
			{ cwd, yes: options.yes }
		);

		intro();

		const result = await tryCommand(runTransform(transforms, transformOptions, configResult));

		outro(formatResult(result));

		await runAfterHooksWithLog(config, { command: 'config.transform', result }, { cwd });
	});

export type ConfigAddTransformCommandResult = {
	duration: number;
	transforms: number;
};

export async function runTransform(
	transformsArg: string[],
	options: ConfigAddTransformOptions,
	config: { config: Config; path: AbsolutePath }
): Promise<Result<ConfigAddTransformCommandResult, CLIError>> {
	const start = performance.now();

	const transformsResult = parsePlugins(transformsArg, 'transform');
	if (transformsResult.isErr()) return err(transformsResult.error);
	const transforms = transformsResult.value;

	const codeResult = readFileSync(config.path);
	if (codeResult.isErr()) return err(codeResult.error);
	const code = codeResult.value;

	const newCodeResult = await addPluginsToConfig({
		plugins: transforms,
		key: 'transforms',
		config: { path: config.path, code },
	});
	if (newCodeResult.isErr()) return err(newCodeResult.error);
	const newCode = newCodeResult.value;

	const writeResult = writeFileSync(config.path, newCode);
	if (writeResult.isErr()) return err(writeResult.error);

	await promptInstallDependencies(
		{
			devDependencies: transforms.map((transform) => ({
				name: transform.packageName,
				version: transform.version,
			})),
			dependencies: [],
		},
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
