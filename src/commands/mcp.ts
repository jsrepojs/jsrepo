import { Argument, Command } from 'commander';
import { connectServer } from '../utils/mcp';

export const mcp = new Command('mcp')
	.description('Interact with jsrepo through an MCP server.')
	.addArgument(new Argument('<registry>', 'The registry to use.').argOptional())
	.action(async (registry?: string) => {
		await connectServer(registry).catch((err) => {
			console.error(err);
			process.exit(1);
		});
	});
