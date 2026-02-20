import path from 'pathe';
import { describe, expect, it } from 'vitest';
import { tryGetTsconfig } from '@/utils/tsconfig';

describe('tryGetTsconfig', () => {
	it('should find a tsconfig for a directory that has one', () => {
		const fixtureDir = path.join(__dirname, '../fixtures/langs/js-baseurl-bare-imports');
		const result = tryGetTsconfig(fixtureDir);
		expect(result.isOk()).toBe(true);
		expect(result._unsafeUnwrap()).not.toBeNull();
	});

	it('should return the same Result reference on repeated calls (cache hit)', () => {
		const fixtureDir = path.join(__dirname, '../fixtures/langs/js-baseurl-bare-imports');
		const first = tryGetTsconfig(fixtureDir);
		const second = tryGetTsconfig(fixtureDir);
		expect(first).toBe(second);
	});

	it('should return ok(null) for a path with no tsconfig', () => {
		// /tmp is outside the workspace so no parent tsconfig will be found
		const result = tryGetTsconfig('/tmp/jsrepo-test-no-tsconfig-dir');
		expect(result.isOk()).toBe(true);
		expect(result._unsafeUnwrap()).toBeNull();
	});

	it('should cache a null result and return the same reference', () => {
		const fakeDir = '/tmp/jsrepo-test-cached-null';
		const first = tryGetTsconfig(fakeDir);
		const second = tryGetTsconfig(fakeDir);
		expect(first._unsafeUnwrap()).toBeNull();
		expect(first).toBe(second);
	});

	it('should treat undefined fileName and "tsconfig.json" as the same cache key', () => {
		// Both normalize to the same key so they must return the same reference
		const fixtureDir = path.join(__dirname, '../fixtures/langs/js-baseurl-bare-imports');
		const defaultResult = tryGetTsconfig(fixtureDir);
		const namedResult = tryGetTsconfig(fixtureDir, 'tsconfig.json');
		expect(defaultResult).toBe(namedResult);
	});

	it('should use different cache entries for different fileNames', () => {
		const fixtureDir = path.join(__dirname, '../fixtures/langs/js-baseurl-bare-imports');
		const tsResult = tryGetTsconfig(fixtureDir, 'tsconfig.json');
		const jsResult = tryGetTsconfig(fixtureDir, 'jsconfig.json');
		// different file names → different keys → independent results
		expect(tsResult).not.toBe(jsResult);
	});
});
