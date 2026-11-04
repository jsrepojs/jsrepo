import { describe, expect, it } from 'vitest';
import plugin, { pnpm } from '../src/index.js';

describe('pnpm plugin', () => {
	it('should be a plugin that provides the remote dependency resolver', () => {
		const p = plugin();
		expect(p.name).toBe('pnpm');
		expect(typeof p.build?.remoteDependencyResolver).toBe('function');
	});

	it('should keep the named export for the legacy build option', () => {
		expect(typeof pnpm()).toBe('function');
	});
});
