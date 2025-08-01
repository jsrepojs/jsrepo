import { ValibotJsonSchemaAdapter } from '@tmcp/adapter-valibot';
import { StdioTransport } from '@tmcp/transport-stdio';
import { McpServer } from 'tmcp';
import * as v from 'valibot';
import { cli } from '../cli';
import { preloadBlocks } from './blocks';
import * as array from './blocks/ts/array';
import * as url from './blocks/ts/url';
import { getProjectConfig } from './config';
import { packageJson } from './context';
import { iFetch } from './fetch';
import * as registry from './registry-providers/internal';
import * as jsrepo from './registry-providers/jsrepo';

const adapter = new ValibotJsonSchemaAdapter();

const ListComponentsArgsSchema = v.object({
	registries: v.pipe(
		v.optional(v.array(v.string())),
		v.metadata({
			description:
				'Registries to list components from. If not provided will use the registries in the users jsrepo.json file.',
		})
	),
	cwd: v.pipe(
		v.string(),
		v.metadata({
			description: 'The current working directory of the users project.',
		})
	),
});

const GetComponentCodeArgsSchema = v.object({
	registry: v.pipe(
		v.string(),
		v.metadata({
			description: 'Registry for the component.',
		})
	),
	component: v.pipe(
		v.string(),
		v.metadata({
			description: 'The component to get the code for. Format: <category>/<block>',
		})
	),
	includeTests: v.pipe(
		v.optional(v.boolean()),
		v.metadata({
			description: 'Should tests be included with the component code.',
		})
	),
	includeDocs: v.pipe(
		v.optional(v.boolean()),
		v.metadata({
			description: 'Should docs be included with the component code.',
		})
	),
});

const GetConfigFilesArgsSchema = v.object({
	registry: v.pipe(
		v.string(),
		v.metadata({
			description: 'Registry to list config files from.',
		})
	),
	requiredOnly: v.pipe(
		v.optional(v.boolean()),
		v.metadata({
			description:
				'When true only returns the config files required for the registry to work properly.',
		})
	),
});

const SearchRegistriesArgsSchema = v.object({
	query: v.pipe(
		v.string(),
		v.metadata({
			description: 'A term to search for the registries by.',
		})
	),
});

type ListComponentsArgs = v.InferOutput<typeof ListComponentsArgsSchema>;
type GetComponentCodeArgs = v.InferOutput<typeof GetComponentCodeArgsSchema>;
type GetConfigFilesArgs = v.InferOutput<typeof GetConfigFilesArgsSchema>;
type SearchRegistriesArgs = v.InferOutput<typeof SearchRegistriesArgsSchema>;

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

export async function connectServer(registry?: string) {
	const server = new McpServer(
		{
			name: 'jsrepo',
			version: packageJson.version,
			description: 'The jsrepo MCP server.',
		},
		{
			adapter,
			capabilities: {
				tools: { listChanged: true },
			},
		}
	);

	server.tool(
		{
			name: 'list-components',
			description:
				'Lists all available components/utilities for the provided registries. If registries are not provided tries to use the registries in the users jsrepo.json file.',
			schema: ListComponentsArgsSchema,
		},
		async ({ registries, cwd }) => {
			if (registry) registries = [registry];

			const response = await listComponents({ registries, cwd });

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
	);

	server.tool(
		{
			name: 'get-component-code',
			description: 'Returns the associated code files for the provided component.',
			schema: GetComponentCodeArgsSchema,
		},
		async ({ registry: reg, component, includeTests, includeDocs }) => {
			if (registry) reg = registry;

			const response = await getComponentCode({
				registry: reg,
				component,
				includeTests,
				includeDocs,
			});

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(response),
					},
				],
			};
		}
	);

	server.tool(
		{
			name: 'get-config-files',
			description:
				'Lists the config files for this registry. These are files that are either necessary for the registry to work or optional as marked by the `optional` boolean on each file.',
			schema: GetConfigFilesArgsSchema,
		},
		async ({ registry: reg, requiredOnly }) => {
			if (registry) reg = registry;

			const response = await getConfigFiles({ registry: reg, requiredOnly });

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(response),
					},
				],
			};
		}
	);

	server.tool(
		{
			name: 'search-registries',
			description:
				'Search jsrepo.com for registries that could include components the user needs in their project.',
			schema: SearchRegistriesArgsSchema,
		},
		async ({ query }) => {
			const response = await searchRegistries({ query });

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(response),
					},
				],
			};
		}
	);

	server.tool(
		{
			name: 'cli-reference',
			description: 'A reference for the usage of the jsrepo CLI.',
		},
		async () => {
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
	);

	const transport = new StdioTransport(server);
	transport.listen();

	console.error('Server connected');
}
