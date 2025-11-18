import * as p from '@clack/prompts';
import { Option } from 'commander';
import type { Result } from 'nevereverthrow';
import pc from 'picocolors';
import { z } from 'zod';
import { InvalidOptionsError, JsrepoError } from '@/utils/errors';
import type { AbsolutePath } from '@/utils/types';
import { safeValidate } from '@/utils/zod';

export const TRACE_ENV_VAR = 'JSREPO_TRACE';

export const defaultCommandOptionsSchema = z.object({
	cwd: z.string().transform((v) => v as AbsolutePath),
});

export const commonOptions = {
	yes: new Option('--yes', 'Skip the confirmation prompt.').default(false),
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
		if (e instanceof JsrepoError) error(e);
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
