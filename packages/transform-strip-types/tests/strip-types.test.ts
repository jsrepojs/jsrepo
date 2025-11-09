import { describe, expect, it } from 'vitest';
import stripTypes from '../src';

describe('stripTypes', () => {
	it('should strip types from TypeScript code and rename the file', async () => {
		const plugin = stripTypes();
		const code = 'const a: string = "hello";';
		const result = await plugin.transform({
			code,
			fileName: 'test.ts',
			options: {
				cwd: '',
				item: { name: 'test', type: 'component' },
				registryUrl: 'https://example.com',
			},
		});
		expect(result.code).toBe('const a = "hello";');
		expect(result.fileName).toBe('test.js');
	});

	it('should not strip types from non-TypeScript files', async () => {
		const plugin = stripTypes();
		const code = 'const a: string = "hello";';
		const result = await plugin.transform({
			code,
			fileName: 'test.js',
			options: {
				cwd: '',
				item: { name: 'test', type: 'component' },
				registryUrl: 'https://example.com',
			},
		});
		expect(result.code).toBe(code);
		expect(result.fileName).toBe(undefined);
	});

	it('should allow for custom supported extensions', async () => {
		const plugin = stripTypes({ supportedExtensions: [{ ts: 'rts', js: 'rjs' }] });
		const code = 'const a: string = "hello";';
		const result = await plugin.transform({
			code,
			fileName: 'test.rts',
			options: {
				cwd: '',
				item: { name: 'test', type: 'component' },
				registryUrl: 'https://example.com',
			},
		});
		expect(result.code).toBe('const a = "hello";');
		expect(result.fileName).toBe('test.rjs');
	});
});
