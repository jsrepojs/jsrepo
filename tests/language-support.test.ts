import { describe, expect, it } from 'vitest';
import { resolutionEquality } from '../src/utils/language-support';

describe('resolutionEquality', () => {
	it('returns true for a .js and .ts extension that are equal', () => {
		expect(resolutionEquality('test.ts', 'test.js')).toBe(true);
	});

	it('returns true for a no extension and .ts extension that are equal', () => {
		expect(resolutionEquality('test.ts', 'test')).toBe(true);
	});

	it('returns true for a no extension and .js extension that are equal', () => {
		expect(resolutionEquality('test.js', 'test')).toBe(true);
	});
});
