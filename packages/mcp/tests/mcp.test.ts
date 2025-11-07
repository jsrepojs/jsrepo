import { InMemoryTransport } from '@tmcp/transport-in-memory';
import { describe, expect, it } from 'vitest';
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
});
