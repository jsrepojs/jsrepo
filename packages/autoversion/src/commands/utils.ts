import * as p from '@clack/prompts';
import { Option } from 'commander';
import type { Result } from 'nevereverthrow';
import pc from 'picocolors';
import { z } from 'zod';
import { InvalidOptionsError, AutoVersionError } from '@/utils/errors';
import { safeValidate } from '@/utils/zod';
import { extractAsync } from '@/utils/utils';
import type { Config, RegistryConfig, RegistryConfigArgs } from 'jsrepo/config';

export const TRACE_ENV_VAR = 'JSREPO_TRACE';

export const defaultCommandOptionsSchema = z.object({
	cwd: z.string(),
});

export const commonOptions = {
	yes: new Option('--yes', 'Skip the confirmation prompt.').default(false),
	verbose: new Option('--verbose', 'Include debug logs.').default(false),
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
export async function tryCommand<T, E extends AutoVersionError>(
	command: Promise<Result<T, E>>
): Promise<T> {
	try {
		const result = await command;
		if (result.isErr()) return error(result.error);
		return result.value;
	} catch (e) {
		error(
			new AutoVersionError(e instanceof Error ? e.message : String(e), {
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
