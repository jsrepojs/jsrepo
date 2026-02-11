import os from 'node:os';
import { cancel, isCancel, multiselect } from '@clack/prompts';
import { Command, Option } from 'commander';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import { z } from 'zod';
import type { AbsolutePath, Config } from '@/api';
import {
	commonOptions,
	defaultCommandOptionsSchema,
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import { loadConfigSearch } from '@/utils/config/utils';
import { type CLIError, JsrepoError } from '@/utils/errors';
import { existsSync, readFileSync, writeFileSync } from '@/utils/fs';
import { runAfterHooks, runBeforeHooks } from '@/utils/hooks';
import { stringify } from '@/utils/json';
import { joinAbsolute } from '@/utils/path';
import { intro, outro } from '@/utils/prompts';
import { safeParseFromJSON } from '@/utils/zod';

const supportedClients = ['cursor', 'claude', 'vscode', 'codex', 'antigravity'] as const;

export const schema = defaultCommandOptionsSchema.extend({
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
	.addOption(commonOptions.cwd)
	.action(async (rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: false,
		});
		const config = (configResult?.config ?? {}) as Config;
		const cwd = options.cwd;

		await runBeforeHooks(config, { command: 'config.mcp', options }, { cwd, yes: false });

		intro();

		const result = await tryCommand(runMcp(options));

		outro(formatResult({ ...result, cwd: options.cwd }));

		await runAfterHooks(config, { command: 'config.mcp', result }, { cwd });
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

	const start = performance.now();

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
	filePath: (cwd: AbsolutePath) => AbsolutePath;
	writeConfig: (filePath: AbsolutePath) => Result<void, CLIError>;
}

function writeConfig(filePath: AbsolutePath, content: string): Result<void, CLIError> {
	try {
		writeFileSync(filePath, content);
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

const MCP_SERVER_CONFIG_JSON: ServerConfig = {
	command: 'npx',
	args: ['@jsrepo/mcp'],
} as const;

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

const ServerConfigSchema = z.object({
	command: z.string(),
	args: z.array(z.string()),
	env: z.record(z.string(), z.string()).optional(),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export const McpServerConfigSchema = z.object({
	mcpServers: z.record(z.string(), ServerConfigSchema),
});

export const VSCodeServerConfigSchema = z.object({
	servers: z.record(z.string(), ServerConfigSchema),
});

export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;
export type VSCodeServerConfig = z.infer<typeof VSCodeServerConfigSchema>;

export function updateJsonConfig({
	existingContent,
	serverName,
	serverConfig,
}: {
	existingContent: string;
	serverName: string;
	serverConfig: ServerConfig;
}): Result<string, CLIError> {
	if (existingContent.trim().length === 0) {
		return ok(
			stringify({ mcpServers: { [serverName]: serverConfig } } satisfies McpServerConfig, {
				format: true,
			})
		);
	}

	const parsedContentResult = safeParseFromJSON(McpServerConfigSchema, existingContent);
	if (parsedContentResult.isErr()) {
		return err(
			new JsrepoError(
				`Failed to parse MCP server config: ${parsedContentResult.error.message}`,
				{
					suggestion: 'Please try again.',
				}
			)
		);
	}
	const parsedContent = parsedContentResult.value;

	const newContent = {
		mcpServers: {
			...parsedContent.mcpServers,
			[serverName]: serverConfig,
		},
	} satisfies McpServerConfig;

	return ok(stringify(newContent, { format: true }));
}

export function updateVSCodeJsonConfig({
	existingContent,
	serverName,
	serverConfig,
}: {
	existingContent: string;
	serverName: string;
	serverConfig: ServerConfig;
}): Result<string, CLIError> {
	if (existingContent.trim().length === 0) {
		return ok(
			stringify({ servers: { [serverName]: serverConfig } } satisfies VSCodeServerConfig, {
				format: true,
			})
		);
	}

	const parsedContentResult = safeParseFromJSON(VSCodeServerConfigSchema, existingContent);
	if (parsedContentResult.isErr()) {
		return err(
			new JsrepoError(
				`Failed to parse MCP server config: ${parsedContentResult.error.message}`,
				{
					suggestion: 'Please try again.',
				}
			)
		);
	}
	const parsedContent = parsedContentResult.value;

	const newContent = {
		servers: {
			...parsedContent.servers,
			[serverName]: serverConfig,
		},
	} satisfies VSCodeServerConfig;

	return ok(stringify(newContent, { format: true }));
}

function updateJsonFile(
	filePath: AbsolutePath,
	config: ServerConfig,
	type: 'generic' | 'vscode' = 'generic'
): Result<void, CLIError> {
	const existingContent = existsSync(filePath) ? readFileSync(filePath)._unsafeUnwrap() : '';
	const newContent =
		type === 'vscode'
			? updateVSCodeJsonConfig({
					existingContent,
					serverName: 'jsrepo',
					serverConfig: config,
				})
			: updateJsonConfig({
					existingContent,
					serverName: 'jsrepo',
					serverConfig: config,
				});
	if (newContent.isErr()) return err(newContent.error);
	return writeConfig(filePath, newContent.value);
}

const CLIENTS: Record<McpClient, ClientConfig> = {
	cursor: {
		name: 'Cursor',
		filePath: (cwd: AbsolutePath) => joinAbsolute(cwd, '.cursor/mcp.json'),
		writeConfig: (filePath: AbsolutePath) => updateJsonFile(filePath, MCP_SERVER_CONFIG_JSON),
	},
	claude: {
		name: 'Claude Code',
		filePath: (cwd: AbsolutePath) => joinAbsolute(cwd, '.mcp.json'),
		writeConfig: (filePath: AbsolutePath) => updateJsonFile(filePath, MCP_SERVER_CONFIG_JSON),
	},
	vscode: {
		name: 'VS Code',
		filePath: (cwd: AbsolutePath) => joinAbsolute(cwd, '.vscode/mcp.json'),
		writeConfig: (filePath: AbsolutePath) =>
			updateJsonFile(filePath, MCP_SERVER_CONFIG_JSON, 'vscode'),
	},
	codex: {
		name: 'Codex',
		filePath: () => joinAbsolute(os.homedir() as AbsolutePath, '.codex/config.toml'),
		writeConfig: (filePath: AbsolutePath) => {
			const existingContent = existsSync(filePath)
				? readFileSync(filePath)._unsafeUnwrap()
				: '';
			const newContent = updateTomlConfig(existingContent);
			return writeConfig(filePath, newContent);
		},
	},
	antigravity: {
		name: 'Antigravity',
		filePath: () =>
			joinAbsolute(os.homedir() as AbsolutePath, '.gemini/antigravity/mcp_config.json'),
		writeConfig: (filePath: AbsolutePath) => updateJsonFile(filePath, MCP_SERVER_CONFIG_JSON),
	},
};
