import { describe, expect, it } from 'vitest';
import {
	isOptionalRole,
	normalizeRole,
	normalizeRoleName,
	normalizeWithRoles,
	shouldIncludeRole,
} from '@/utils/roles';

describe('normalizeRole', () => {
	it('trims, lowercases, and handles empty input', () => {
		expect(normalizeRole(undefined)).toBeUndefined();
		expect(normalizeRole('')).toBeUndefined();
		expect(normalizeRole('   ')).toBeUndefined();
		expect(normalizeRole(' EXAMPLE ')).toBe('example');
	});
});

describe('normalizeRoleName', () => {
	it('resolves aliases and preserves custom roles', () => {
		expect(normalizeRoleName(undefined)).toBeUndefined();
		expect(normalizeRoleName(' examples ')).toBe('example');
		expect(normalizeRoleName('DOCS')).toBe('doc');
		expect(normalizeRoleName('tests')).toBe('test');
		expect(normalizeRoleName('StoryBook')).toBe('storybook');
	});
});

describe('normalizeWithRoles', () => {
	it('combines explicit roles with legacy flags', () => {
		const result = normalizeWithRoles([' storybook ', 'EXAMPLES'], {
			withExamples: true,
			withDocs: false,
			withTests: true,
		});

		expect(result.has('storybook')).toBe(true);
		expect(result.has('example')).toBe(true);
		expect(result.has('test')).toBe(true);
		expect(result.has('doc')).toBe(false);
	});
});

describe('shouldIncludeRole', () => {
	it('includes file roles by default and respects custom roles', () => {
		const withRoles = new Set(['example', 'storybook']);

		expect(shouldIncludeRole(undefined, withRoles)).toBe(true);
		expect(shouldIncludeRole('file', withRoles)).toBe(true);
		expect(shouldIncludeRole('example', withRoles)).toBe(true);
		expect(shouldIncludeRole('examples', withRoles)).toBe(true);
		expect(shouldIncludeRole('storybook', withRoles)).toBe(true);
		expect(shouldIncludeRole('doc', withRoles)).toBe(false);
	});
});

describe('isOptionalRole', () => {
	it('distinguishes optional roles from file', () => {
		expect(isOptionalRole(undefined)).toBe(false);
		expect(isOptionalRole('file')).toBe(false);
		expect(isOptionalRole(' example ')).toBe(true);
		expect(isOptionalRole('storybook')).toBe(true);
	});
});
