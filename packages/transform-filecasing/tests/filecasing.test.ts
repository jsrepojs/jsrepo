import type { AbsolutePath, ItemRelativePath } from 'jsrepo/utils';
import { describe, expect, it } from 'vitest';
import fileCasing from '../src';

const transformOptions = {
	cwd: '' as AbsolutePath,
	item: { name: 'test', type: 'component' as const },
	registryUrl: 'https://example.com',
};

describe('fileCasing', () => {
	it('should allow being called with no options', async () => {
		const plugin = fileCasing();
		const result = await plugin.transform({
			code: 'const x = 1;',
			fileName: 'myComponent.ts' as ItemRelativePath,
			options: transformOptions,
		});
		expect(result.fileName).toBe('my-component.ts');
	});

	describe('kebab-case to camelCase', () => {
		it('should convert kebab-case filename to camelCase', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myComponent.ts');
		});
	});

	describe('camelCase to kebab-case', () => {
		it('should convert camelCase filename to kebab-case', async () => {
			const plugin = fileCasing({ to: 'kebab' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'myComponent.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('my-component.ts');
		});
	});

	describe('to snake_case', () => {
		it('should convert kebab-case filename to snake_case', async () => {
			const plugin = fileCasing({ to: 'snake' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('my_component.ts');
		});

		it('should convert camelCase filename to snake_case', async () => {
			const plugin = fileCasing({ to: 'snake' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'myComponent.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('my_component.ts');
		});
	});

	describe('to PascalCase', () => {
		it('should convert kebab-case filename to PascalCase', async () => {
			const plugin = fileCasing({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('MyComponent.ts');
		});

		it('should convert camelCase filename to PascalCase', async () => {
			const plugin = fileCasing({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'myComponent.tsx' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('MyComponent.tsx');
		});
	});

	describe('preserves file extension', () => {
		it('should preserve .ts extension', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-file.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myFile.ts');
		});

		it('should preserve .tsx extension', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-file.tsx' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myFile.tsx');
		});

		it('should preserve .js extension', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-file.js' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myFile.js');
		});

		it('should preserve .svelte extension', async () => {
			const plugin = fileCasing({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.svelte' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('MyComponent.svelte');
		});

		it('should preserve .d.ts extension', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-types.d.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myTypes.d.ts');
		});
	});

	describe('handles filenames with directories', () => {
		it('should transform directory segments', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-components/use-hook.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myComponents/useHook.ts');
		});

		it('should handle deeply nested paths', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'src/my-components/ui/my-button.tsx' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('src/myComponents/ui/myButton.tsx');
		});

		it('should still return a new path when only directories change', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-components/index.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myComponents/index.ts');
		});
	});

	describe('no transformation when case matches target', () => {
		it('should return undefined fileName when already camelCase and target is camel', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'myComponent.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBeUndefined();
		});

		it('should return undefined fileName when already kebab-case and target is kebab', async () => {
			const plugin = fileCasing({ to: 'kebab' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBeUndefined();
		});

		it('should return undefined fileName when already PascalCase and target is pascal', async () => {
			const plugin = fileCasing({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'MyComponent.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBeUndefined();
		});

		it('should return undefined fileName when already snake_case and target is snake', async () => {
			const plugin = fileCasing({ to: 'snake' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my_component.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBeUndefined();
		});
	});

	describe('edge cases', () => {
		it('should throw error for invalid case type', () => {
			// @ts-expect-error - testing invalid input
			expect(() => fileCasing({ to: 'invalid' })).toThrow(
				'Invalid case type: "invalid". Expected one of: kebab, camel, snake, pascal'
			);
		});

		it('should handle multi-dot filenames (e.g., Angular-style my.component.tsx)', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-button.component.tsx' as ItemRelativePath,
				options: transformOptions,
			});
			// Only the first segment (before first dot) is transformed
			expect(result.fileName).toBe('myButton.component.tsx');
		});

		it('should handle single word filename', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'component.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBeUndefined();
		});

		it('should handle single word with PascalCase target', async () => {
			const plugin = fileCasing({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'component.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('Component.ts');
		});

		it('should handle file with multiple dots in name', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-component.test.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myComponent.test.ts');
		});

		it('should handle index files', async () => {
			const plugin = fileCasing({ to: 'pascal' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'index.ts' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('Index.ts');
		});

		it('should handle file without extension', async () => {
			const plugin = fileCasing({ to: 'camel' });
			const result = await plugin.transform({
				code: 'const x = 1;',
				fileName: 'my-file' as ItemRelativePath,
				options: transformOptions,
			});
			expect(result.fileName).toBe('myFile');
		});
	});
});
