import { describe, expect, it } from 'vitest';
import plugin, { bun } from '../src/index.js';

describe('bun plugin', () => {
	it('should be a plugin that provides the remote dependency resolver', () => {
		const p = plugin();
		expect(p.name).toBe('bun');
		expect(typeof p.build?.remoteDependencyResolver).toBe('function');
	});

	it('should keep the named export for the legacy build option', () => {
		expect(typeof bun()).toBe('function');
	});
});
