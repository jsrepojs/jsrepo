import { describe, expect, it } from 'vitest';
import stripTypes from '../src';

describe('stripTypes plugin', () => {
	it('should be a plugin with a transform', () => {
		const plugin = stripTypes();
		expect(plugin.name).toBe('javascript');
		expect(plugin.transforms).toHaveLength(1);
		expect(typeof plugin.transforms?.[0]?.transform).toBe('function');
	});
});
