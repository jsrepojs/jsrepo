import { ZodJsonSchemaAdapter } from '@tmcp/adapter-zod';
import dedent from 'dedent';
import fuzzysort from 'fuzzysort';
import {
	getPathsForItems,
	normalizeItemTypeForPath,
	OptionallyInstalledRegistryTypes,
	prepareUpdates,
	promptAddEnvVars,
	RegistryItemNotFoundError,
	type RegistryItemWithContent,
	resolveAndFetchAllItems,
	updateFiles,
} from 'jsrepo';
import { loadConfigSearch } from 'jsrepo/config';
import { DEFAULT_PROVIDERS } from 'jsrepo/providers';
import {
	parseWantedItems,
	promptInstallDependenciesByEcosystem,
	resolveRegistries,
	resolveWantedItems,
} from 'jsrepo/utils';
import { McpServer } from 'tmcp';
import { z } from 'zod';
import pkg from '../package.json';
import { commonOptions } from './utils';

const adapter = new ZodJsonSchemaAdapter();
const server = new McpServer(
	{
		name: 'jsrepo',
		version: pkg.version,
		description:
			'An MCP server for adding, viewing, and searching items from jsrepo registries.',
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
		name: 'add_item_to_project',
		description: 'Add a registry item or items to the users project.',
		schema: z.object({
			cwd: commonOptions.cwd,
			itemNames: z
				.array(
					z
						.string()
						.describe(
							'The registry and name of the item to add `<registry>/<item-name>`. i.e. "github/ieedan/std/math", "@ieedan/std/math", "https://example.com/registry/math"'
						)
				)
				.describe(
					'Fully qualifed registry items to add. i.e. ["github/ieedan/std/math", "@ieedan/std/math", "https://example.com/registry/math"]'
				),
			withExamples: z.boolean().optional().describe('Add items with examples.'),
			withDocs: z.boolean().optional().describe('Add items with docs.'),
			withTests: z.boolean().optional().describe('Add items with tests.'),
		}),
	},
	async ({ itemNames, ...options }) => {
		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: false,
		});

		const providers = configResult?.config?.providers ?? DEFAULT_PROVIDERS;
		const registries = configResult?.config?.registries ?? [];

		const { wantedItems, neededRegistries } = parseWantedItems(itemNames, {
			providers,
			registries,
		}).match(
			(value) => value,
			(error) => {
				throw error;
			}
		);

		const resolvedRegistries = (
			await resolveRegistries(neededRegistries, {
				cwd: options.cwd,
				providers,
			})
		).match(
			(value) => value,
			(error) => {
				throw error;
			}
		);

		const resolvedWantedItems = (
			await resolveWantedItems(wantedItems, {
				resolvedRegistries,
				nonInteractive: true,
			})
		).match(
			(value) => value,
			(error) => {
				throw error;
			}
		);

		const items = (await resolveAndFetchAllItems(resolvedWantedItems)).match(
			(value) => value,
			(error) => {
				throw error;
			}
		);

		const getPathsForItemsResult = await getPathsForItems({
			items,
			config: configResult?.config,
			options: { cwd: options.cwd, yes: true },
		});
		if (getPathsForItemsResult.isErr()) {
			return {
				content: [
					{
						type: 'text',
						text: dedent`
						Failed to get paths for items: ${getPathsForItemsResult.error.message}.
						You will need to add the paths to the users config file (if they aren't already added) like so:
						\`\`\`
						import { defineConfig } from "jsrepo";

						export default defineConfig({
							// ...
							paths: {
							    // ...
								${items.map((item) => `"${normalizeItemTypeForPath(item.type)}": "put the expected path here",`).join('\n')}
							},
						});
						\`\`\`
						`,
					},
				],
			};
		}
		const { itemPaths, resolvedPaths } = getPathsForItemsResult.value;

		const { neededDependencies, neededEnvVars, neededFiles } = (
			await prepareUpdates({
				configResult,
				options: {
					cwd: options.cwd,
					yes: true,
					withExamples: options.withExamples ?? false,
					withDocs: options.withDocs ?? false,
					withTests: options.withTests ?? false,
				},
				itemPaths,
				resolvedPaths,
				items,
			})
		).match(
			(value) => value,
			(error) => {
				throw error;
			}
		);

		await updateFiles({
			files: neededFiles,
			options: { overwrite: true, cwd: options.cwd, expand: false, maxUnchanged: 10 },
		});

		if (neededEnvVars)
			await promptAddEnvVars(neededEnvVars, { options: { cwd: options.cwd, yes: true } });

		await promptInstallDependenciesByEcosystem(neededDependencies, {
			options: { cwd: options.cwd, yes: true },
			config: configResult?.config,
		});

		return {
			content: [
				{
					type: 'text',
					text: dedent`Added ${items.length} items to the users project:
					${items.map((item) => displayItemDetails(item)).join('\n')}`,
				},
			],
		};
	}
);

server.tool(
	{
		name: 'view_registry_item',
		description: 'View the code and information about a registry item.',
		schema: z.object({
			cwd: commonOptions.cwd,
			item: z
				.string()
				.describe(
					'The registry and name of the item to add `<registry>/<item-name>`. i.e. "github/ieedan/std/math", "@ieedan/std/math", "https://example.com/registry/math"'
				),
		}),
	},
	async ({ cwd, item }) => {
		const configResult = await loadConfigSearch({
			cwd,
			promptForContinueIfNull: false,
		});

		const providers = configResult?.config?.providers ?? DEFAULT_PROVIDERS;
		const registries = configResult?.config?.registries ?? [];

		const { wantedItems, neededRegistries } = parseWantedItems([item], {
			providers,
			registries,
		}).match(
			(value) => value,
			(error) => {
				throw error;
			}
		);

		const resolvedRegistries = (
			await resolveRegistries(neededRegistries, {
				cwd,
				providers,
			})
		).match(
			(value) => value,
			(error) => {
				throw error;
			}
		);

		const resolvedWantedItems = (
			await resolveWantedItems(wantedItems, {
				resolvedRegistries,
				nonInteractive: true,
			})
		).match(
			(value) => value,
			(error) => {
				throw error;
			}
		);

		const items = (await resolveAndFetchAllItems(resolvedWantedItems)).match(
			(value) => value,
			(error) => {
				throw error;
			}
		);

		const wantedItem = wantedItems[0]!;

		const itemResult = items.find((i) => i.name === wantedItem.itemName);
		if (!itemResult)
			throw new RegistryItemNotFoundError(wantedItem.itemName, wantedItem.registryUrl);

		return {
			content: [
				{
					type: 'text',
					text: displayItemDetails(itemResult),
				},
			],
		};
	}
);

server.tool(
	{
		name: 'search_items_in_registry',
		description: 'Search for a registry item.',
		schema: z.object({
			cwd: commonOptions.cwd,
			registries: z
				.array(z.string())
				.describe(
					'The registries to search for items in. i.e. ["github/ieedan/std", "@ieedan/std"]'
				),
			query: z.string().describe('The query to search for. i.e. "math"'),
			limit: z
				.number()
				.optional()
				.describe('The maximum number of items to return. Defaults to 10.'),
			offset: z.number().optional().describe('The numbers to skip for pagination.'),
		}),
	},
	async ({ cwd, registries, query, limit: l, offset: o }) => {
		const limit = l ?? 10;
		const offset = o ?? 0;
		const configResult = await loadConfigSearch({
			cwd,
			promptForContinueIfNull: false,
		});

		const providers = configResult?.config?.providers ?? DEFAULT_PROVIDERS;

		const resolvedRegistries = (
			await resolveRegistries(registries, {
				cwd,
				providers,
			})
		).match(
			(value) => value,
			(error) => {
				throw error;
			}
		);

		const candidateItems = Array.from(resolvedRegistries.values()).flatMap((registry) =>
			registry.manifest.items.map((item) => ({ item, registry }))
		);

		// filter items by query

		const results = fuzzysort.go(query, candidateItems, {
			keys: ['item.name', 'item.description', 'item.type'],
		});

		if (results.length === 0) {
			return {
				content: [
					{
						type: 'text',
						text: dedent`
						No results found for "${query}".
						`,
					},
				],
			};
		}

		const cutResults = results
			.slice(offset, Math.min(offset + limit, results.length))
			.map((result) => result.obj);

		function displayItem(item: (typeof candidateItems)[number]) {
			return dedent`
			## ${item.item.name} - ${item.item.type}
			${item.item.description}

			Registry: ${item.registry.url}
			`;
		}

		return {
			content: [
				{
					type: 'text',
					text: dedent`
					# Search results
					Found ${results.length} results for "${query}".
					Showing ${cutResults.length} results.

					${cutResults.map(displayItem).join('\n')}
					`,
				},
			],
		};
	}
);

function displayItemDetails(item: RegistryItemWithContent): string {
	return dedent`
	# ${item.name} - ${item.type}
	${item.description}

	## Files
	${item.files
		?.filter(
			(file) =>
				file.type === undefined ||
				!(OptionallyInstalledRegistryTypes as unknown as string[]).includes(file.type)
		)
		.map((file) => `\`\`\`${file.path}\n${file.content}\n\`\`\``)
		.join('\n')}

	## Dependencies
	${item.dependencies?.map((dependency) => `- ${typeof dependency === 'string' ? dependency : dependency.name}`).join('\n')}

	## Examples
	${item.files
		?.filter((file) => file.type === 'registry:example')
		.map((file) => `\`\`\`${file.path}\n${file.content}\n\`\`\``)
		.join('\n')}

	## Docs
	${item.files
		?.filter((file) => file.type === 'registry:doc')
		.map((file) => `\`\`\`${file.path}\n${file.content}\n\`\`\``)
		.join('\n')}

	## Tests
	${item.files
		?.filter((file) => file.type === 'registry:test')
		.map((file) => `\`\`\`${file.path}\n${file.content}\n\`\`\``)
		.join('\n')}

	## Environment Variables
	Environment variables are required for the item to work. Blank variables will need to be filled in.
	\`\`\`env
	${Object.entries(item.envVars ?? {})
		.map(([name, value]) => `${name}="${value}"`)
		.join('\n')}
	\`\`\`
	`;
}

export { server };
