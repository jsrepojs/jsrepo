import { InMemoryTransport } from '@tmcp/transport-in-memory';
import { assert, describe, expect, it } from 'vitest';
import { server } from '../src/server';

const transport = new InMemoryTransport(server);
const session = transport.session();

describe('server', () => {
	// kinda a stupid test for now but it ensures I ship the MCP server with the correct tools
	it('should list the expected tools', async () => {
		const listResult = await session.listTools();

		const expectedTools = [
			'add_item_to_project',
			'view_registry_item',
			'list_items_in_registry',
		];

		const toolNames = listResult.tools.map((t) => t.name);

		for (const tool of expectedTools) {
			expect(toolNames).toContain(tool);
		}
	});

	it('should list items for a registry', async () => {
		const result = await session.callTool('list_items_in_registry', {
			cwd: process.cwd(),
			registries: ['@ieedan/shadcn-svelte-extras@beta'],
			query: 'math',
		});

		assert(result.content?.[0].type === 'text');
		expect(result.content[0].text).toContain('# Search results\nFound');
	});

	it('should show a specific registry item', async () => {
		const result = await session.callTool('view_registry_item', {
			cwd: process.cwd(),
			item: '@ieedan/shadcn-svelte-extras@beta/button',
		});

		assert(result.content?.[0].type === 'text');
		expect(result.content[0].text).toContain('buttonVariants');
	});
});
