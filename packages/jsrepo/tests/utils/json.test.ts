import { describe, expect, it } from 'vitest';
import { stringify } from '@/utils/json';

describe('stringify', () => {
	const nested = { foo: 1, bar: { baz: 'qux' } };

	it('uses tab indentation when format is omitted', () => {
		expect(stringify(nested)).toBe(JSON.stringify(nested, null, '\t'));
	});

	it('uses tab indentation when format is true', () => {
		expect(stringify(nested, { format: true })).toBe(JSON.stringify(nested, null, '\t'));
	});

	it('uses compact JSON when format is false', () => {
		expect(stringify(nested, { format: false })).toBe(JSON.stringify(nested));
	});

	it('uses custom spacing when format is an object with space', () => {
		expect(stringify(nested, { format: { space: '  ' } })).toBe(
			JSON.stringify(nested, null, '  ')
		);
	});
});
