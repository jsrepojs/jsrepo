import { describe, expect, it } from 'vitest';
import fileCasing from '../src';

describe('fileCasing plugin', () => {
	it('should be a plugin with a transform', () => {
		const plugin = fileCasing({ to: 'camel' });
		expect(plugin.name).toBe('filecasing');
		expect(plugin.transforms).toHaveLength(1);
		expect(typeof plugin.transforms?.[0]?.transform).toBe('function');
	});
});
