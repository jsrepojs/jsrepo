import { describe, expect, it } from 'vitest';
import { BASE_URL as JSREPO_BASE_URL } from '../src/utils/registry-providers/jsrepo';

// just here to prevent me from shooting myself in the foot
describe('JSREPO_BASE_URL', () => {
	it('is the correct url', () => {
		expect(JSREPO_BASE_URL).toBe('https://www.jsrepo.com');
	});
});
