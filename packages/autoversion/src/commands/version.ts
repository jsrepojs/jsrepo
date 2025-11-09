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
import { intro, outro } from '@/utils/prompts';
import type { CLIError } from '@/utils/errors';
import { ConfigNotFoundError } from 'jsrepo/errors'
import { type Config, loadConfigSearch } from 'jsrepo/config';

export const schema = defaultCommandOptionsSchema.extend({
	yes: z.boolean(),
});

export type VersionOptions = z.infer<typeof schema>;

export const version = new Command('version')
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
			runVersion(
				languages,
				// this way if the config is found in a higher directory we base everything off of that directory
				{ ...options, cwd: configResult ? path.dirname(configResult.path) : options.cwd },
				configResult
			)
		);

		outro(formatResult(result));
	});

export type ConfigAddLanguageCommandResult = {
	duration: number;
	languages: number;
};

export async function runVersion(
	languagesArg: string[],
	options: VersionOptions,
	config: { config: Config; path: string }
): Promise<Result<ConfigAddLanguageCommandResult, CLIError>> {
	const start = performance.now();

	

	const end = performance.now();
	const duration = end - start;

	return ok({ duration, languages: languagesArg.length });
}

export function formatResult({ duration, languages }: ConfigAddLanguageCommandResult): string {
	return `Added ${pc.green(languages.toString())} ${languages > 1 ? 'languages' : 'language'} in ${pc.green(
		`${duration.toFixed(2)}ms`
	)}.`;
}
