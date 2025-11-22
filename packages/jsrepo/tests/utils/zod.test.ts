import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { safeParseFromJSON, safeValidate } from '@/utils/zod';

describe('safeParse', () => {
	it('returns error when schema invalid', () => {
		const schema = z.object({
			title: z.string(),
		});

		const object = {};

		const result = safeValidate(schema, object);

		expect(result.isErr()).toBe(true);
	});

	it('returns ok when schema valid', () => {
		const schema = z.object({
			title: z.string(),
		});

		const object = { title: 'Test' };

		const result = safeValidate(schema, object);

		expect(result.isOk()).toBe(true);
	});
});

describe('safeParseFromJSON', () => {
	it('returns error when JSON is invalid', () => {
		const schema = z.object({
			title: z.string(),
		});

		const invalidJSON = '{ title: "Test" '; // Missing closing brace

		const result = safeParseFromJSON(schema, invalidJSON);

		expect(result.isErr()).toBe(true);
	});

	it('returns error when JSON is valid but schema validation fails', () => {
		const schema = z.object({
			title: z.string(),
		});

		const validJSON = '{}'; // Valid JSON but missing required title

		const result = safeParseFromJSON(schema, validJSON);

		expect(result.isErr()).toBe(true);
	});

	it('returns ok when JSON is valid and schema validation passes', () => {
		const schema = z.object({
			title: z.string(),
		});

		const validJSON = '{ "title": "Test" }';

		const result = safeParseFromJSON(schema, validJSON);

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.title).toBe('Test');
		}
	});
});
