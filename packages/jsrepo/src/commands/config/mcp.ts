import fs from 'node:fs';
import os from 'node:os';
import { cancel, isCancel, multiselect } from '@clack/prompts';
import { Command, Option } from 'commander';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import { z } from 'zod';
import {
	defaultCommandOptions,
	defaultCommandOptionsSchema,
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import { type CLIError, JsrepoError } from '@/utils/errors';
import { stringify } from '@/utils/json';
import { intro, outro } from '@/utils/prompts';

const supportedClients = ['cursor', 'claude', 'vscode', 'codex'] as const;

export const schema = z.object({
	...defaultCommandOptionsSchema.shape,
	client: z.array(z.enum(supportedClients)).optional(),
	all: z.boolean().optional(),
});

export type ConfigMcpOptions = z.infer<typeof schema>;

type McpClient = (typeof supportedClients)[number];

export const mcp = new Command('mcp')
	.description('Configure the jsrepo MCP server for your environment.')
	.addOption(
		new Option('--client <clients...>', 'The MCP client(s) to configure').choices(
			supportedClients
		)
	)
	.option('--all', `Configure all supported MCP clients`, false)
	.addOptions(...defaultCommandOptions)
	.action(async (rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		intro();

		const result = await tryCommand(runMcp(options));

		outro(formatResult({ ...result, cwd: options.cwd }));
	});

export type ClientConfigResult = {
	name: string;
	filePath: string;
};

export type ClientResult = {
	name: string;
	result: Result<{ filePath: string }, CLIError>;
};

export type ConfigMcpCommandResult = {
	duration: number;
	results: ClientResult[];
};

export async function runMcp(
	options: ConfigMcpOptions
): Promise<Result<ConfigMcpCommandResult, CLIError>> {
	const start = performance.now();

	let clientsToConfigure: McpClient[];

	if (options.all) {
		clientsToConfigure = Object.keys(CLIENTS) as McpClient[];
	} else if (options.client && options.client.length > 0) {
		clientsToConfigure = options.client;
	} else {
		const clientOptions = Object.entries(CLIENTS).map(([value, config]) => ({
			value: value as McpClient,
			label: config.name,
		}));

		const selected = await multiselect({
			message: 'Which clients would you like to configure?',
			options: clientOptions,
		});

		if (isCancel(selected)) {
			cancel('Canceled!');
			process.exit(0);
		}

		clientsToConfigure = selected;
	}

	const results: ClientResult[] = [];

	for (const wantedClient of clientsToConfigure) {
		const client = CLIENTS[wantedClient];
		const filePath = client.filePath(options.cwd);

		const result = client.writeConfig(filePath);
		results.push({
			name: client.name,
			result: result.isErr() ? err(result.error) : ok({ filePath }),
		});
	}

	const end = performance.now();
	const duration = end - start;

	return ok({ duration, results });
}

export function formatResult({
	duration,
	results,
	cwd,
}: ConfigMcpCommandResult & { cwd: string }): string {
	return `Configured ${results.length} ${results.length > 1 ? 'clients' : 'client'} in ${pc.green(
		`${duration.toFixed(2)}ms`
	)}:\n${results.map((result) => formatClientResult(result, cwd)).join('\n')}`;
}

function formatClientResult({ name, result }: ClientResult, cwd: string): string {
	if (result.isErr()) {
		return `   ${pc.cyan(name)}: ${pc.red(result.error.message)}`;
	}
	const { filePath } = result.value;
	return `   ${pc.cyan(name)} → ${pc.dim(path.relative(cwd, filePath))}`;
}

interface ClientConfig {
	name: string;
	filePath: (cwd: string) => string;
	writeConfig: (filePath: string) => Result<void, CLIError>;
}

function writeConfig(filePath: string, content: string): Result<void, CLIError> {
	try {
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		fs.writeFileSync(filePath, content);
		return ok(undefined);
	} catch (e) {
		return err(
			new JsrepoError(
				`Failed to write config to ${filePath}: ${e instanceof Error ? e.message : String(e)}`,
				{
					suggestion: 'Please try again.',
				}
			)
		);
	}
}

const MCP_SERVER_CONFIG_JSON = {
	mcpServers: {
		jsrepo: {
			command: 'npx',
			args: ['@jsrepo/mcp'],
		},
	},
};

const MCP_SERVER_CONFIG_TOML = `[mcp_servers.jsrepo]
command = "npx"
args = ["@jsrepo/mcp"]
`;

export function updateTomlConfig(existingContent: string): string {
	if (!existingContent) return MCP_SERVER_CONFIG_TOML;
	if (existingContent.includes('[mcp_servers.jsrepo]')) return existingContent;

	// Ensure there is space between the last section and the new config
	if (!existingContent.endsWith('\n')) existingContent += '\n';

	return `${existingContent}${MCP_SERVER_CONFIG_TOML}`;
}

const CLIENTS: Record<McpClient, ClientConfig> = {
	cursor: {
		name: 'Cursor',
		filePath: (cwd: string) => path.join(cwd, '.cursor/mcp.json'),
		writeConfig: (filePath: string) =>
			writeConfig(filePath, stringify(MCP_SERVER_CONFIG_JSON, { format: true })),
	},
	claude: {
		name: 'Claude Code',
		filePath: (cwd: string) => path.join(cwd, '.mcp.json'),
		writeConfig: (filePath: string) =>
			writeConfig(filePath, stringify(MCP_SERVER_CONFIG_JSON, { format: true })),
	},
	vscode: {
		name: 'VS Code',
		filePath: (cwd: string) => path.join(cwd, '.vscode/mcp.json'),
		writeConfig: (filePath: string) =>
			writeConfig(filePath, stringify(MCP_SERVER_CONFIG_JSON, { format: true })),
	},
	codex: {
		name: 'Codex',
		filePath: () => path.join(os.homedir(), '.codex/config.toml'),
		writeConfig: (filePath: string) => {
			const existingContent = fs.existsSync(filePath)
				? fs.readFileSync(filePath, 'utf-8')
				: '';
			const newContent = updateTomlConfig(existingContent);
			return writeConfig(filePath, newContent);
		},
	},
};
