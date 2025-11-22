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
