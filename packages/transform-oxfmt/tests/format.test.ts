import { describe, expect, it } from 'vitest';
import oxfmt from '../src';

const transformOptions = {
	cwd: '',
	item: { name: 'test', type: 'component' as const },
	registryUrl: 'https://example.com',
};

describe('oxfmt', () => {
	it('formats JavaScript code', async () => {
		const plugin = oxfmt();
		const code = 'const a=1;const b=2;';
		const result = await plugin.transform({
			code,
			fileName: 'test.js',
			options: transformOptions,
		});
		expect(result.code).toBe('const a = 1;\nconst b = 2;\n');
	});

	it('formats TypeScript code', async () => {
		const plugin = oxfmt();
		const code = 'const a:string="hello";';
		const result = await plugin.transform({
			code,
			fileName: 'test.ts',
			options: transformOptions,
		});
		expect(result.code).toBe('const a: string = "hello";\n');
	});

	it('respects formatting options', async () => {
		const plugin = oxfmt({ semi: false });
		const code = 'const a = 1;';
		const result = await plugin.transform({
			code,
			fileName: 'test.js',
			options: transformOptions,
		});
		expect(result.code).toBe('const a = 1\n');
	});

	it('returns undefined when format encounters errors', async () => {
		const plugin = oxfmt();
		// Invalid syntax that will cause parse errors
		const code = 'const a = {{{';
		const result = await plugin.transform({
			code,
			fileName: 'test.js',
			options: transformOptions,
		});
		expect(result.code).toBeUndefined();
	});
});
