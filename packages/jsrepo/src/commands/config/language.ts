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
import { intro, outro, promptInstallDependencies } from '@/utils/prompts';
import type { AbsolutePath } from '@/utils/types';

export const schema = defaultCommandOptionsSchema.extend({
	yes: z.boolean(),
});

export type ConfigAddLanguageOptions = z.infer<typeof schema>;

export const language = new Command('language')
	.description('Add a language to your config.')
	.argument(
		'[languages...]',
		'Names of the languages you want to add to your config. ex: (jsrepo-language-go, jsrepo-language-rust)'
	)
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.yes)
	.action(async (languages, rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		intro();

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: !options.yes,
		});
		if (!configResult) error(new ConfigNotFoundError(options.cwd));

		const result = await tryCommand(
			runLanguage(
				languages,
				// this way if the config is found in a higher directory we base everything off of that directory
				{
					...options,
					cwd: configResult
						? (path.dirname(configResult.path) as AbsolutePath)
						: options.cwd,
				},
				configResult
			)
		);

		outro(formatResult(result));
	});

export type ConfigAddLanguageCommandResult = {
	duration: number;
	languages: number;
};

export async function runLanguage(
	languagesArg: string[],
	options: ConfigAddLanguageOptions,
	config: { config: Config; path: AbsolutePath }
): Promise<Result<ConfigAddLanguageCommandResult, CLIError>> {
	const start = performance.now();

	const languagesResult = parsePlugins(languagesArg, 'language');
	if (languagesResult.isErr()) return err(languagesResult.error);
	const languages = languagesResult.value;
	const codeResult = readFileSync(config.path);
	if (codeResult.isErr()) return err(codeResult.error);
	const code = codeResult.value;

	const newCodeResult = await addPluginsToConfig({
		plugins: languages,
		key: 'languages',
		config: { path: config.path, code },
	});
	if (newCodeResult.isErr()) return err(newCodeResult.error);
	const newCode = newCodeResult.value;

	const writeResult = writeFileSync(config.path, newCode);
	if (writeResult.isErr()) return err(writeResult.error);

	await promptInstallDependencies(
		{ devDependencies: languages, dependencies: [] },
		{ options, configPath: config.path }
	);

	const end = performance.now();
	const duration = end - start;

	return ok({ duration, languages: languagesArg.length });
}

export function formatResult({ duration, languages }: ConfigAddLanguageCommandResult): string {
	return `Added ${pc.green(languages.toString())} ${languages > 1 ? 'languages' : 'language'} in ${pc.green(
		`${duration.toFixed(2)}ms`
	)}.`;
}
