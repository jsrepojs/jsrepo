import { describe, expect, it } from 'vitest';
import changeCase from '../src';

const transformOptions = {
	cwd: '' as any,
	item: { name: 'test', type: 'component' as const },
	registryUrl: 'https://example.com',
};

describe('changeCase', () => {
	describe('kebab-case to camelCase', () => {
		it('should convert kebab-case filename to camelCase', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myComponent.ts');
			expect(result.code).toBe('const x = 1;');
		});
	});

	describe('camelCase to kebab-case', () => {
		it('should convert camelCase filename to kebab-case', async () => {
			const plugin = changeCase({ to: 'kebab' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'myComponent.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('my-component.ts');
			expect(result.code).toBe('const x = 1;');
		});
	});

	describe('to snake_case', () => {
		it('should convert kebab-case filename to snake_case', async () => {
			const plugin = changeCase({ to: 'snake' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('my_component.ts');
			expect(result.code).toBe('const x = 1;');
		});

		it('should convert camelCase filename to snake_case', async () => {
			const plugin = changeCase({ to: 'snake' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'myComponent.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('my_component.ts');
			expect(result.code).toBe('const x = 1;');
		});
	});

	describe('to PascalCase', () => {
		it('should convert kebab-case filename to PascalCase', async () => {
			const plugin = changeCase({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('MyComponent.ts');
			expect(result.code).toBe('const x = 1;');
		});

		it('should convert camelCase filename to PascalCase', async () => {
			const plugin = changeCase({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'myComponent.tsx' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('MyComponent.tsx');
			expect(result.code).toBe('const x = 1;');
		});
	});

	describe('preserves file extension', () => {
		it('should preserve .ts extension', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-file.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myFile.ts');
		});

		it('should preserve .tsx extension', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-file.tsx' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myFile.tsx');
		});

		it('should preserve .js extension', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-file.js' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myFile.js');
		});

		it('should preserve .svelte extension', async () => {
			const plugin = changeCase({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.svelte' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('MyComponent.svelte');
		});

		it('should preserve .d.ts extension', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-types.d.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myTypes.d.ts');
		});
	});

	describe('handles filenames with directories', () => {
		it('should only transform the filename, not the directory path', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'components/my-component.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('components/myComponent.ts');
		});

		it('should handle deeply nested paths', async () => {
			const plugin = changeCase({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'src/components/ui/my-button.tsx' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('src/components/ui/MyButton.tsx');
		});

		it('should handle kebab-case directories without transforming them', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-components/use-hook.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('my-components/useHook.ts');
		});
	});

	describe('no transformation when case matches target', () => {
		it('should return undefined fileName when already camelCase and target is camel', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'myComponent.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBeUndefined();
			expect(result.code).toBe('const x = 1;');
		});

		it('should return undefined fileName when already kebab-case and target is kebab', async () => {
			const plugin = changeCase({ to: 'kebab' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBeUndefined();
			expect(result.code).toBe('const x = 1;');
		});

		it('should return undefined fileName when already PascalCase and target is pascal', async () => {
			const plugin = changeCase({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'MyComponent.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBeUndefined();
			expect(result.code).toBe('const x = 1;');
		});

		it('should return undefined fileName when already snake_case and target is snake', async () => {
			const plugin = changeCase({ to: 'snake' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my_component.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBeUndefined();
			expect(result.code).toBe('const x = 1;');
		});
	});

	describe('edge cases', () => {
		it('should handle single word filename', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'component.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBeUndefined();
			expect(result.code).toBe('const x = 1;');
		});

		it('should handle single word with PascalCase target', async () => {
			const plugin = changeCase({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'component.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('Component.ts');
		});

		it('should handle file with multiple dots in name', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.test.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myComponent.test.ts');
		});

		it('should handle index files', async () => {
			const plugin = changeCase({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'index.ts' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('Index.ts');
		});

		it('should handle file without extension', async () => {
			const plugin = changeCase({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-file' as any,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myFile');
		});
	});
});
