import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	type CallToolRequest,
	CallToolRequestSchema,
	ListToolsRequestSchema,
	type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import color from 'chalk';
import { cli } from '../cli';
import { preloadBlocks } from './blocks';
import * as array from './blocks/ts/array';
import * as url from './blocks/ts/url';
import { getProjectConfig } from './config';
import { packageJson } from './context';
import { iFetch } from './fetch';
import * as registry from './registry-providers/internal';
import * as jsrepo from './registry-providers/jsrepo';

const listComponentsTool: Tool = {
	name: 'list-components',
	description:
		'Lists all available components/utilities for the provided registries. If registries are not provided tries to use the registries in the users jsrepo.json file.',
	inputSchema: {
		type: 'object',
		properties: {
			registries: {
				type: 'array',
				description:
					'Registries to list components from. If not provided will use the registries in the users jsrepo.json file.',
				items: {
					type: 'string',
				},
			},
			cwd: {
				type: 'string',
				description: 'The current working directory of the users project.',
			},
		},
		required: ['cwd'],
	},
};

interface ListComponentsArgs {
	registries?: string[];
	cwd: string;
}

async function listComponents({ registries, cwd }: ListComponentsArgs) {
	if (!registries) {
		const config = getProjectConfig(cwd).match(
			(v) => v,
			() => {
				throw new Error(
					'Could not find your configuration file! Please provide `registries`.'
				);
			}
		);

		if (config.repos.length === 0) {
			throw new Error(
				'No registries (repos) in your configuration file! Please provide `registries`.'
			);
		}

		registries = config.repos;
	}

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
			.map((c) => url.join(c.sourceRepo.url, `${c.category}/${c.name}`)),
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
				description:
					'The component to get the code for. Format: <registry>/<category>/<block>',
			},
			includeTests: {
				type: 'boolean',
				description: 'Should tests be included with the component code.',
				default: false,
			},
			includeDocs: {
				type: 'boolean',
				description: 'Should docs be included with the component code.',
				default: false,
			},
		},
		required: ['component'],
	},
};

interface GetComponentCodeArgs {
	component: string;
	includeTests?: boolean;
	includeDocs?: boolean;
}

async function getComponentCode({
	component,
	includeTests = false,
	includeDocs = false,
}: GetComponentCodeArgs) {
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

	const preloaded = preloadBlocks([block], { includeTests, includeDocs });

	const files = (await Promise.all(preloaded.map((p) => p.files))).flatMap((p) => [
		...p.map((f) => ({ name: f.name, content: f.content.unwrapOr('<FETCH ERROR>') })),
	]);

	return {
		registry: repo,
		component: specifier,
		files,
		commands: {
			add: `jsrepo add ${component} -y -A`,
			addMultiple: `jsrepo add ${component} ... -y -A`,
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
				description: 'Registry to list config files from.',
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

const searchRegistriesTool: Tool = {
	name: 'search-registries',
	description:
		'Search jsrepo.com for registries that could include components the user needs in their project.',
	inputSchema: {
		type: 'object',
		properties: {
			query: {
				description: 'A term to search for the registries by.',
				type: 'string',
			},
		},
		required: ['query'],
	},
};

interface SearchRegistriesArgs {
	query: string;
}

async function searchRegistries({ query }: SearchRegistriesArgs) {
	const response = await iFetch(
		`${jsrepo.BASE_URL}/api/registries?order_by=most_popular&q=${query}`
	);

	if (!response.ok) return [];

	const { data } = await response.json();

	return {
		// @ts-expect-error shut up
		registries: data.map((r) => {
			const name = `@${r.scope.name}/${r.name}`;
			return {
				name,
				description: r.metaDescription,
				repository: r.metaRepository,
				keywords: r.metaTags,
				homepage: r.metaHomepage,
				rating: r.rating,
				primaryLanguage: r.metaPrimaryLanguage,
				monthlyDownloads: r.monthlyFetches,
				latestVersion: r.latestVersion,
				access: r.access,
				commands: {
					init: `jsrepo init ${name}`,
				},
			};
		}),
	};
}

const cliReferenceTool: Tool = {
	name: 'cli-reference',
	description: 'A reference for the usage of the jsrepo CLI.',
	inputSchema: {
		type: 'object',
	},
};

function cliReference() {
	return {
		name: cli.name(),
		description: cli.description(),
		version: cli.version(),
		commands: cli.commands.map((c) => ({
			name: c.name(),
			description: c.description(),
			usage: c.usage(),
			options: c.options.map((o) => ({
				flags: o.flags,
				description: o.description,
				defaultValue: o.defaultValue,
			})),
		})),
	};
}

export async function connectServer() {
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

					const response = await listComponents(args);

					return {
						content: [
							{
								type: 'text',
								text: `Available components:
${JSON.stringify(response.components)}
Add a component to your project with:
jsrepo add ${response.components[0]} -y -A
Add multiple components to your project in parallel with:
jsrepo add ${response.components[0]} ${response.components[1] ?? response.components[0]} ... -y -A
Update existing components with:
jsrepo update ${response.components[0]} -y -A
Update multiple components with:
jsrepo update ${response.components[0]} ${response.components[1] ?? response.components[0]} ... -y -A`,
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
				case 'search-registries': {
					const args = request.params.arguments as unknown as SearchRegistriesArgs;

					const response = await searchRegistries(args);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(response),
							},
						],
					};
				}
				case 'cli-reference': {
					const response = cliReference();

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
			tools: [
				listComponentsTool,
				getComponentCodeTool,
				getConfigFilesTool,
				searchRegistriesTool,
				cliReferenceTool,
			],
		};
	});

	const transport = new StdioServerTransport();

	console.error('Connecting server to transport...');

	await server.connect(transport);

	console.error('Server connected');
}
