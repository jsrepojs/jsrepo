import { describe, expect, it } from 'vitest';
import { kebabToCamel } from '@/utils/casing';

describe('kebabToCamel', () => {
	it('correctly converts to camelCase', () => {
		expect(kebabToCamel('hello-world')).toBe('helloWorld');
		expect(kebabToCamel('hello')).toBe('hello');
	});

	it('Removes trailing dash', () => {
		expect(kebabToCamel('hello-world-')).toBe('helloWorld');
	});
});
