import { assert, describe, expect, it } from 'vitest';
import { updateJsonConfig } from '@/commands/config/mcp';
import { stringify } from '@/utils/json';

describe('updateJsonConfig', () => {
	it('should overwrite existing keys', () => {
		const config = {
			mcpServers: {
				jsrepo: {
					command: 'npx',
					args: ['@jsrepo/mcp'],
					env: {
						FOO: 'bar',
					},
				},
			},
		};

		const result = updateJsonConfig({
			existingContent: JSON.stringify(config),
			serverName: 'jsrepo',
			serverConfig: {
				command: 'npx',
				args: ['@jsrepo/mcp'],
			},
		});
		assert(result.isOk());
		expect(result.value).toBe(
			stringify(
				{
					mcpServers: {
						jsrepo: {
							command: 'npx',
							args: ['@jsrepo/mcp'],
						},
					},
				},
				{ format: true }
			)
		);
	});

	it('should create a new file when empty', () => {
		const result = updateJsonConfig({
			existingContent: '',
			serverName: 'jsrepo',
			serverConfig: { command: 'npx', args: ['@jsrepo/mcp'] },
		});
		assert(result.isOk());
		expect(result.value).toBe(
			stringify(
				{
					mcpServers: {
						jsrepo: {
							command: 'npx',
							args: ['@jsrepo/mcp'],
						},
					},
				},
				{ format: true }
			)
		);
	});

	it('should maintain existing keys', () => {
		const config = {
			mcpServers: {
				github: {
					command: 'npx',
					args: ['@github/mcp'],
				},
			},
		};

		const result = updateJsonConfig({
			existingContent: JSON.stringify(config),
			serverName: 'jsrepo',
			serverConfig: {
				command: 'npx',
				args: ['@jsrepo/mcp'],
			},
		});
		assert(result.isOk());
		expect(result.value).toBe(
			stringify(
				{
					mcpServers: {
						github: {
							command: 'npx',
							args: ['@github/mcp'],
						},
						jsrepo: {
							command: 'npx',
							args: ['@jsrepo/mcp'],
						},
					},
				},
				{ format: true }
			)
		);
	});
});
