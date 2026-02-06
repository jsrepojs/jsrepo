import { describe, expect, it } from 'vitest';
import { isOptionalRole, resolveWithRoles, shouldIncludeRole } from '@/utils/roles';

describe('resolveWithRoles', () => {
	it('combines explicit roles with legacy flags', () => {
		const result = resolveWithRoles(['storybook', 'example'], {
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
	it('includes file roles by default and respects exact role matching', () => {
		const withRoles = new Set(['example', 'storybook']);

		expect(shouldIncludeRole(undefined, withRoles)).toBe(true);
		expect(shouldIncludeRole('file', withRoles)).toBe(true);
		expect(shouldIncludeRole('example', withRoles)).toBe(true);
		expect(shouldIncludeRole('storybook', withRoles)).toBe(true);
		expect(shouldIncludeRole('doc', withRoles)).toBe(false);
		expect(shouldIncludeRole('EXAMPLE', withRoles)).toBe(false);
		expect(shouldIncludeRole(' example ', withRoles)).toBe(false);
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
