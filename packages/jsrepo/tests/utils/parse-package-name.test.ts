import { describe, expect, it } from 'vitest';
import { parsePackageName } from '@/utils/parse-package-name';

describe('parsePackageName', () => {
	it('should parse a simple package name', () => {
		const result = parsePackageName('lodash');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				name: 'lodash',
				version: undefined,
				path: '',
			});
		}
	});

	it('should parse a package name with version', () => {
		const result = parsePackageName('lodash@4.17.21');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				name: 'lodash',
				version: '4.17.21',
				path: '',
			});
		}
	});

	it('should parse a package name with path', () => {
		const result = parsePackageName('lodash/debounce');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				name: 'lodash',
				version: undefined,
				path: '/debounce',
			});
		}
	});

	it('should parse a package name with version and path', () => {
		const result = parsePackageName('lodash@4.17.21/debounce');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				name: 'lodash',
				version: '4.17.21',
				path: '/debounce',
			});
		}
	});

	it('should parse a scoped package name', () => {
		const result = parsePackageName('@jsrepo/transform-prettier');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				name: '@jsrepo/transform-prettier',
				version: undefined,
				path: '',
			});
		}
	});

	it('should parse a scoped package name with version', () => {
		const result = parsePackageName('@jsrepo/transform-prettier@2.1.0');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				name: '@jsrepo/transform-prettier',
				version: '2.1.0',
				path: '',
			});
		}
	});

	it('should parse a scoped package name with path', () => {
		const result = parsePackageName('@jsrepo/transform-prettier/lib');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				name: '@jsrepo/transform-prettier',
				version: undefined,
				path: '/lib',
			});
		}
	});

	it('should parse a scoped package name with version and path', () => {
		const result = parsePackageName('@jsrepo/transform-prettier@2.1.0/lib/utils');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				name: '@jsrepo/transform-prettier',
				version: '2.1.0',
				path: '/lib/utils',
			});
		}
	});

	it('should handle complex version specifiers', () => {
		const result = parsePackageName('lodash@^4.17.0');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				name: 'lodash',
				version: '^4.17.0',
				path: '',
			});
		}
	});

	it('should handle beta versions', () => {
		const result = parsePackageName('react@18.0.0-beta.1');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				name: 'react',
				version: '18.0.0-beta.1',
				path: '',
			});
		}
	});

	it('should return error for invalid package names', () => {
		const result = parsePackageName('');
		expect(result.isErr()).toBe(true);
		if (result.isErr()) {
			expect(result.error).toBe('invalid package name: ');
		}
	});

	it('should return error for malformed package names', () => {
		const result = parsePackageName('@');
		expect(result.isErr()).toBe(true);
		if (result.isErr()) {
			expect(result.error).toBe('invalid package name: @');
		}
	});

	it('should return error for invalid scoped package names', () => {
		const result = parsePackageName('@scope/');
		expect(result.isErr()).toBe(true);
		if (result.isErr()) {
			expect(result.error).toBe('invalid package name: @scope/');
		}
	});
});
