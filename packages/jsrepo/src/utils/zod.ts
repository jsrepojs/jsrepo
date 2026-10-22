import { err, ok, type Result } from 'nevereverthrow';
import type { z } from 'zod';
import { InvalidJSONError, ZodError } from '@/utils/errors';

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): Result<T, ZodError> {
	const parsed = schema.safeParse(data);
	if (parsed.success) {
		return ok(parsed.data);
	}
	return err(new ZodError(parsed.error));
}

export function safeParseFromJSON<T>(
	schema: z.ZodSchema<T>,
	data: string
): Result<T, InvalidJSONError | ZodError> {
	try {
		const parsed = schema.safeParse(JSON.parse(data));
		if (parsed.success) {
			return ok(parsed.data);
		}
		return err(new ZodError(parsed.error));
	} catch (error) {
		return err(new InvalidJSONError(error));
	}
}

/**
 * A value that may be `undefined` and may be missing from the parsed JSON entirely.
 *
 * The inferred output type keeps the key required (`key: T | undefined`) so that code building these
 * objects has to pass it explicitly. `z.union([schema, z.undefined()])` can't be used for this since
 * zod 4.4 requires the key to be present in the input for it.
 */
export function valueOptional<T extends z.ZodType>(schema: T) {
	return schema.optional().transform((value) => value);
}
