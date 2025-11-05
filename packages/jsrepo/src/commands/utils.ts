import * as p from '@clack/prompts';
import { Option } from 'commander';
import type { Result } from 'nevereverthrow';
import pc from 'picocolors';
import { z } from 'zod';
import type { Config, RegistryConfig, RegistryConfigArgs } from '@/utils/config';
import { InvalidOptionsError, JsrepoError } from '@/utils/errors';
import { extractAsync } from '@/utils/utils';
import { safeValidate } from '@/utils/zod';

export const TRACE_ENV_VAR = 'JSREPO_TRACE';

export const defaultCommandOptionsSchema = z.object({
	cwd: z.string(),
});

export const commonOptions = {
	yes: new Option('--yes', 'Skip the confirmation prompt.').default(false),
	noCache: new Option('--no-cache', 'Disable caching of resolved git urls.').default(false),
	verbose: new Option('--verbose', 'Include debug logs.').default(false),
	overwrite: new Option('--overwrite', 'Overwrite files without prompting.').default(false),
	expand: new Option('-E, --expand', 'Expands the diff so you see the entire file.').default(
		false
	),
	maxUnchanged: new Option(
		'--max-unchanged <lines>',
		'Maximum unchanged lines that will show without being collapsed.'
	)
		.argParser((value) => Number.parseInt(value, 10))
		.default(5),
	cwd: new Option('--cwd <path>', 'The current working directory.').default(process.cwd()),
};

export function parseOptions<T>(
	schema: z.ZodSchema<T>,
	rawOptions: unknown
): z.infer<typeof schema> {
	return safeValidate(schema, rawOptions).match(
		(v) => v,
		(e) => error(new InvalidOptionsError(e.zodError))
	);
}

/**
 * Tries to run the command. If the command fails, it will log the error and exit the program.
 * @param command
 * @returns
 */
export async function tryCommand<T, E extends JsrepoError>(
	command: Promise<Result<T, E>>
): Promise<T> {
	try {
		const result = await command;
		if (result.isErr()) return error(result.error);
		return result.value;
	} catch (e) {
		error(
			new JsrepoError(e instanceof Error ? e.message : String(e), {
				suggestion: 'Please try again.',
			})
		);
	}
}

/**
 * Log error and exit the program.
 * @param error - The error to print.
 */
export function error(err: Error): never {
	return handleError(err);
}

function handleError(err: Error): never {
	p.log.message();
	if (process.env[TRACE_ENV_VAR] === '1') {
		console.trace(err);
		process.exit(1);
	} else {
		p.cancel(pc.red(err.toString()));
		process.exit(1);
	}
}

/**
 * Iterates over every registry in the config fetching the config on demand if provided as a callback.
 *
 * @param config
 * @param callback
 * @param args
 */
export async function forEachRegistry<T>(
	config: Config,
	callback: (registry: RegistryConfig) => Promise<T>,
	args: RegistryConfigArgs[0]
): Promise<T[]> {
	if (Array.isArray(config.registry)) {
		const results = [];
		for (const rc of config.registry) {
			results.push(await callback(await extractAsync(rc, ...[args])));
		}
		return results;
	} else {
		return [await callback(await extractAsync(config.registry, ...[args]))];
	}
}

export function hasRegistries(config: Config): boolean {
	return Array.isArray(config.registry) ? config.registry.length > 0 : true;
}
