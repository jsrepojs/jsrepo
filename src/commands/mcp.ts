import { Command } from 'commander';
import * as v from 'valibot';
import { connectServer } from '../utils/mcp';

const schema = v.object({
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

export const mcp = new Command('mcp')
	.description('Interact with jsrepo through an MCP server.')
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (opts) => {
		const options = v.parse(schema, opts);

		await _mcp(options);
	});

async function _mcp(options: Options) {
	await connectServer({ cwd: options.cwd });
}
