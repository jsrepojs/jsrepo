import fs from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	type CallToolRequest,
	CallToolRequestSchema,
	ListToolsRequestSchema,
	type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import color from 'chalk';
import path from 'pathe';
import * as v from 'valibot';
import { preloadBlocks } from './blocks';
import * as array from './blocks/ts/array';
import * as url from './blocks/ts/url';
import { PROJECT_CONFIG_NAME, projectConfigSchema } from './config';
import { packageJson } from './context';
import * as registry from './registry-providers/internal';

const listComponentsTool: Tool = {
	name: 'list-components',
	description:
		'Lists all available components for the registries defined in the jsrepo.json file.',
	inputSchema: {
		type: 'object',
		properties: {
			registry: {
				type: 'string',
				description:
					'Registry to list components from. (If not provided will return all for the current config file.)',
				examples: [
					'@ieedan/std',
					'github/ieedan/std',
					'gitlab/ieedan/std',
					'bitbucket/ieedan/std',
					'azure/ieedan/std/std',
					'https://example.com/r',
				],
			},
		},
	},
};

interface ListComponentsArgs {
	registry?: string;
}

async function listComponents(registries: string[]) {
	const states = (await registry.forEachPathGetProviderState(registries)).match(
		(v) => v,
		(err) => {
			throw new Error(`Error getting registry state for ${err.repo}: ${err.message}`);
		}
	);

	const components = (await registry.fetchBlocks(states)).match(
		(v) => v,
		(err) => {
			throw new Error(`Error getting components for ${err.repo}: ${err.message}`);
		}
	);

	return {
		components: array
			.fromMap(components, (_, v) => v)
			.map((c) => {
				const name = `${c.category}/${c.name}`;
				const fullName = url.join(c.sourceRepo.url, name);

				return {
					fullName: name,
					...c,
					sourceRepo: undefined,
					commands: {
						add: `jsrepo add ${fullName} -y -A`,
						update: `jsrepo update ${fullName} -y -A`,
					},
				};
			}),
	};
}

const getComponentCodeTool: Tool = {
	name: 'get-component-code',
	description: 'Returns the associated code files for the provided component.',
	inputSchema: {
		type: 'object',
		properties: {
			component: {
				type: 'string',
				description: 'The component to get the code for.',
				examples: [
					'@ieedan/std/ts/math',
					'github/ieedan/std/ts/math',
					'gitlab/ieedan/std/ts/math',
					'azure/ieedan/std/std',
					'https://example.com/r/ts/math',
				],
			},
			includeTests: {
				type: 'boolean',
				description: 'Should tests be included with the component code.',
				default: false,
			},
		},
		required: ['component'],
	},
};

interface GetComponentCodeArgs {
	component: string;
	includeTests?: boolean;
}

async function getComponentCode({ component, includeTests = false }: GetComponentCodeArgs) {
	const provider = registry.selectProvider(component);

	if (!provider) {
		throw new Error(
			`${component} is not valid! Expected a category and block proceeded by the registry url i.e. @ieedan/std/<category>/<block>`
		);
	}

	const { url: repo, specifier } = provider.parse(component, { fullyQualified: true });

	if (!specifier) {
		throw new Error(
			`${component} is not valid! Expected a category and block proceeded by the registry url i.e. @ieedan/std/<category>/<block>`
		);
	}

	const state = (await registry.getProviderState(repo)).match(
		(v) => v,
		(err) => {
			throw new Error(`Error getting state for ${repo}: ${err}`);
		}
	);

	const manifests = (await registry.fetchManifests([state])).match(
		(v) => v,
		(err) => {
			throw new Error(`Error getting manifest for ${repo}: ${err}`);
		}
	);

	const blocksMap = registry.getRemoteBlocks(manifests);

	const block = blocksMap.get(url.join(repo, specifier));

	if (!block) {
		throw new Error(`${specifier} does not exist in ${repo}`);
	}

	const preloaded = preloadBlocks([block], { includeTests });

	const files = (await Promise.all(preloaded.map((p) => p.files))).flatMap((p) => [
		...p.map((f) => ({ name: f.name, content: f.content.unwrapOr('<FETCH ERROR>') })),
	]);

	return {
		registry: repo,
		component: specifier,
		files,
		commands: {
			add: `jsrepo add ${component} -y -A`,
			update: `jsrepo update ${component} -y -A`,
		},
	};
}

const getConfigFilesTool: Tool = {
	name: 'get-config-files',
	description:
		'Lists the config files for this registry. These are files that are either necessary for the registry to work or optional as marked by the `optional` boolean on each file.',
	inputSchema: {
		type: 'object',
		properties: {
			registry: {
				type: 'string',
				description:
					'Registry to list components from. (If not provided will return all for the current config file.)',
				examples: [
					'@ieedan/std',
					'github/ieedan/std',
					'gitlab/ieedan/std',
					'bitbucket/ieedan/std',
					'azure/ieedan/std/std',
					'https://example.com/r',
				],
			},
			requiredOnly: {
				type: 'boolean',
				description:
					'When true only returns the config files required for the registry to work properly.',
			},
		},
		required: ['registry'],
	},
};

interface GetConfigFilesArgs {
	registry: string;
	requiredOnly?: boolean;
}

async function getConfigFiles({ registry: repo, requiredOnly = false }: GetConfigFilesArgs) {
	const state = (await registry.getProviderState(repo)).match(
		(v) => v,
		(err) => {
			throw new Error(`Error getting state for ${repo}: ${err}`);
		}
	);

	const manifest = (await registry.fetchManifest(state)).match(
		(v) => v,
		(err) => {
			throw new Error(`Error getting manifest for ${repo}: ${err}`);
		}
	);

	if (!manifest.configFiles || manifest.configFiles.length === 0) return [];

	const files = await Promise.all(
		manifest.configFiles
			.filter((f) => !requiredOnly || !f.optional)
			.map(async (f) => {
				const content = (await registry.fetchRaw(state, f.path)).unwrapOr('<FETCH ERROR>');

				return {
					...f,
					content,
				};
			})
	);

	return {
		configFiles: files,
	};
}

export async function connectServer({ cwd }: { cwd: string }) {
	const server = new Server(
		{
			name: 'jsrepo',
			version: packageJson.version,
		},
		{
			capabilities: {
				tools: {},
			},
		}
	);

	server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
		console.error(`Received CallToolRequest calling: ${color.bold(request.params.name)}`);
		try {
			switch (request.params.name) {
				case 'list-components': {
					const args = request.params.arguments as unknown as ListComponentsArgs;

					const registries: string[] = [];

					if (args.registry) {
						registries.push(args.registry);
					} else {
						try {
							const content = fs
								.readFileSync(path.join(cwd, PROJECT_CONFIG_NAME))
								.toString();

							const config = v.parse(projectConfigSchema, JSON.parse(content));

							if (config.repos.length === 0) {
								throw new Error(
									"Your config file doesn't have any `repos` configured. Please provide the `registry` argument or initialize a registry to your config file with `jsrepo init`"
								);
							}

							registries.push(...config.repos);
						} catch {
							throw new Error(
								`Couldn't find a config file in the cwd (${cwd}). Please provide the 'registry' argument.`
							);
						}
					}

					const response = await listComponents(registries);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(response),
							},
						],
					};
				}
				case 'get-component-code': {
					const args = request.params.arguments as unknown as GetComponentCodeArgs;

					const response = await getComponentCode(args);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(response),
							},
						],
					};
				}
				case 'get-config-files': {
					const args = request.params.arguments as unknown as GetConfigFilesArgs;

					const response = await getConfigFiles(args);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(response),
							},
						],
					};
				}
			}

			throw new Error(`Invalid tool ${request.params.name}`);
		} catch (err) {
			console.error(
				color.red(`Error executing tool ${color.bold(request.params.name)}: ${err}`)
			);
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify({
							error: err instanceof Error ? err.message : String(err),
						}),
					},
				],
			};
		}
	});

	server.setRequestHandler(ListToolsRequestSchema, async () => {
		console.error('Received ListToolsRequest');
		return {
			tools: [listComponentsTool, getComponentCodeTool, getConfigFilesTool],
		};
	});

	const transport = new StdioServerTransport();

	console.error('Connecting server to transport...');

	await server.connect(transport);

	console.error('Server connected');
}
