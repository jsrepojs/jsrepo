import { Command } from 'commander';
import { connectServer } from '../utils/mcp';

export const mcp = new Command('mcp')
	.description('Interact with jsrepo through an MCP server.')
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async () => {
		await connectServer().catch((err) => {
			console.error(err);
			process.exit(1);
		});
	});
