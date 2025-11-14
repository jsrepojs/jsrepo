import { cancel, groupMultiselect, isCancel, multiselect } from '@clack/prompts';
import { Command } from 'commander';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import { z } from 'zod';
import {
	commonOptions,
	defaultCommandOptionsSchema,
	error,
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import { DEFAULT_PROVIDERS } from '@/providers';
import {
	getPathsForItems,
	type ItemDistributed,
	type ItemRepository,
	parseWantedItems,
	prepareUpdates,
	type ResolvedWantedItem,
	resolveAndFetchAllItems,
	resolveRegistries,
	resolveWantedItems,
	updateFiles,
} from '@/utils/add';
import type { RemoteDependency } from '@/utils/build';
import type { Config } from '@/utils/config';
import { updateConfigPaths } from '@/utils/config/mods/update-paths';
import { loadConfigSearch } from '@/utils/config/utils';
import { type CLIError, InvalidRegistryError, RegistryNotProvidedError } from '@/utils/errors';
import { readFileSync } from '@/utils/fs';
import {
	initLogging,
	intro,
	outro,
	promptAddEnvVars,
	promptInstallDependenciesByEcosystem,
} from '@/utils/prompts';
import type { AbsolutePath } from '@/utils/types';

export const schema = defaultCommandOptionsSchema.extend({
	yes: z.boolean(),
	all: z.boolean(),
	overwrite: z.boolean(),
	verbose: z.boolean(),
	registry: z.string().optional(),
	withExamples: z.boolean(),
	withDocs: z.boolean(),
	withTests: z.boolean(),
	expand: z.boolean(),
	maxUnchanged: z.number(),
});

export type AddOptions = z.infer<typeof schema>;

export const add = new Command('add')
	.description('Add items to your project.')
	.argument(
		'[items...]',
		'Names of the items you want to add to your project. ex: (utils/math, github/ieedan/std/utils/math)'
	)
	.option('--registry <registry>', 'The registry to add items from.', undefined)
	.option('--all', 'Add all items from every registry.', false)
	.option('--with-examples', 'Add items with examples.', false)
	.option('--with-docs', 'Add items with docs.', false)
	.option('--with-tests', 'Add items with tests.', false)
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.yes)
	.addOption(commonOptions.verbose)
	.addOption(commonOptions.overwrite)
	.addOption(commonOptions.expand)
	.addOption(commonOptions.maxUnchanged)
	.action(async (blockNames, rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		intro();

		const config = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: !options.yes,
		});

		const result = await tryCommand(
			runAdd(
				blockNames,
				// this way if the config is found in a higher directory we base everything off of that directory
				{
					...options,
					cwd: config ? (path.dirname(config.path) as AbsolutePath) : options.cwd,
				},
				config
			)
		);

		outro(formatResult(result));
	});

export type AddCommandResult = {
	items: (ItemRepository | ItemDistributed)[];
	updatedFiles: string[];
	updatedDependencies: RemoteDependency[];
	updatedEnvVars: Record<string, string> | undefined;
	updatedPaths: Config['paths'] | undefined;
};

export async function runAdd(
	itemsArg: string[],
	options: AddOptions,
	configResult: { path: AbsolutePath; config: Config } | null
): Promise<Result<AddCommandResult, CLIError>> {
	const { verbose: _, spinner } = initLogging({ options });

	const config = configResult?.config;

	// this is to support zero config adds
	const providers = config?.providers ?? DEFAULT_PROVIDERS;
	const registries = options.registry ? [options.registry] : (config?.registries ?? []);

	let resolvedWantedItems: ResolvedWantedItem[];

	if (itemsArg.length === 0 || options.all) {
		// in the case that --all was provided we treat items as registry urls
		if (options.all && itemsArg.length > 0) {
			// we ensure that all registries are valid
			for (const item of itemsArg) {
				const foundProvider = providers.some((p) => p.matches(item));
				if (!foundProvider) {
					error(new InvalidRegistryError(item));
				}
			}
		}
		const availableRegistries = itemsArg.length > 0 ? itemsArg : registries;
		// we can't add from 0 registries
		if (availableRegistries.length === 0) return err(new RegistryNotProvidedError());

		spinner.start(
			`Retrieving manifest${registries.length > 1 ? 's' : ''} from ${pc.cyan(registries.join(', '))}`
		);

		const resolvedRegistriesResult = await resolveRegistries(availableRegistries, {
			cwd: options.cwd,
			providers,
		});

		if (resolvedRegistriesResult.isErr()) {
			spinner.stop('Failed to retrieve manifests');
			return err(resolvedRegistriesResult.error);
		}
		spinner.stop(
			`Retrieved manifest${registries.length > 1 ? 's' : ''} from ${pc.cyan(registries.join(', '))}`
		);
		const resolvedRegistries = resolvedRegistriesResult.value;

		const possibleItems = Array.from(resolvedRegistries.entries()).flatMap(([_, registry]) => {
			return registry.manifest.items
				.filter((item) => item)
				.map((item) => ({
					item,
					registry,
				}));
		});

		if (!options.all) {
			let userSelections: string[] | symbol;
			if (resolvedRegistries.size > 1) {
				userSelections = await groupMultiselect({
					message: 'Which items would you like to add?',
					options: possibleItems
						.filter((item) => (item.item.add ?? 'when-added') === 'when-added')
						.reduce(
							(acc, item) => {
								if (!acc[item.registry.url]) {
									acc[item.registry.url] = [];
								}
								acc[item.registry.url]?.push({
									value: `${item.registry.url}/${item.item.name}`,
									label: item.item.name,
									hint: item.item.description,
								});
								return acc;
							},
							{} as Record<
								string,
								{
									value: string;
									label: string;
									hint?: string | undefined;
									disabled?: boolean | undefined;
								}[]
							>
						),
				});
			} else {
				userSelections = await multiselect({
					message: 'Which items would you like to add?',
					options: possibleItems
						.filter((item) => (item.item.add ?? 'when-added') === 'when-added')
						.map((item) => ({
							label:
								resolvedRegistries.size > 1
									? `${item.registry.url}/${item.item.name}`
									: item.item.name,
							value: `${item.registry.url}/${item.item.name}`,
							hint: item.item.description,
						})),
				});
			}

			if (isCancel(userSelections)) {
				cancel('Canceled!');
				process.exit(0);
			}

			resolvedWantedItems = possibleItems
				.filter((item) => userSelections.includes(`${item.registry.url}/${item.item.name}`))
				.map((item) => ({
					registry: item.registry,
					item: item.item,
				}));
		} else {
			// select all items
			resolvedWantedItems = possibleItems;
		}
	} else {
		const parsedWantedItemsResult = parseWantedItems(itemsArg, {
			providers,
			registries: registries,
		});
		if (parsedWantedItemsResult.isErr()) return err(parsedWantedItemsResult.error);
		const { wantedItems, neededRegistries } = parsedWantedItemsResult.value;

		spinner.start(
			`Retrieving manifest${neededRegistries.length > 1 ? 's' : ''} from ${pc.cyan(neededRegistries.join(', '))}`
		);

		const resolvedRegistriesResult = await resolveRegistries(neededRegistries, {
			cwd: options.cwd,
			providers,
		});

		if (resolvedRegistriesResult.isErr()) {
			spinner.stop('Failed to retrieve manifests');
			return err(resolvedRegistriesResult.error);
		}
		spinner.stop(
			`Retrieved manifest${neededRegistries.length > 1 ? 's' : ''} from ${pc.cyan(neededRegistries.join(', '))}`
		);
		const resolvedRegistries = resolvedRegistriesResult.value;

		const resolvedWantedItemsResult = await resolveWantedItems(wantedItems, {
			resolvedRegistries,
			nonInteractive: options.yes,
		});
		if (resolvedWantedItemsResult.isErr()) return err(resolvedWantedItemsResult.error);
		resolvedWantedItems = resolvedWantedItemsResult.value;
	}

	spinner.start(
		`Fetching ${pc.cyan(resolvedWantedItems.map((item) => item.item.name).join(', '))}...`
	);

	const itemsResult = await resolveAndFetchAllItems(resolvedWantedItems, { options });
	if (itemsResult.isErr()) {
		spinner.stop('Failed to fetch items');
		return err(itemsResult.error);
	}
	spinner.stop(
		`Fetched ${pc.cyan(resolvedWantedItems.map((item) => item.item.name).join(', '))}`
	);
	const items = itemsResult.value;

	const itemPathsResult = await getPathsForItems({ items, config, options });
	if (itemPathsResult.isErr()) return err(itemPathsResult.error);
	const { itemPaths, resolvedPaths } = itemPathsResult.value;

	const prepareUpdatesResult = await prepareUpdates({
		configResult,
		options,
		itemPaths,
		resolvedPaths,
		items,
	});
	if (prepareUpdatesResult.isErr()) return err(prepareUpdatesResult.error);
	const { neededDependencies, neededEnvVars, neededFiles, updatedPaths } =
		prepareUpdatesResult.value;

	const updatedFilesResult = await updateFiles({ files: neededFiles, options });
	if (updatedFilesResult.isErr()) return err(updatedFilesResult.error);
	const updatedFiles = updatedFilesResult.value;

	if (configResult && updatedPaths) {
		const configCodeResult = readFileSync(configResult.path);
		if (configCodeResult.isErr()) return err(configCodeResult.error);
		const configCode = configCodeResult.value;
		await updateConfigPaths(updatedPaths, {
			config: { path: configResult.path, code: configCode },
		});
	}

	let updatedEnvVars: Record<string, string> | undefined;
	if (neededEnvVars) {
		const promptAddEnvVarsResult = await promptAddEnvVars(neededEnvVars, { options });
		if (promptAddEnvVarsResult.isErr()) return err(promptAddEnvVarsResult.error);
		updatedEnvVars = promptAddEnvVarsResult.value;
	}

	const updatedDependencies = await promptInstallDependenciesByEcosystem(neededDependencies, {
		options,
		config,
	});

	return ok({
		items,
		updatedDependencies,
		updatedEnvVars,
		updatedFiles,
		updatedPaths,
	});
}

function formatResult(result: AddCommandResult): string {
	const parts: string[] = [
		`Added ${pc.cyan(result.items.map((item) => item.name).join(', '))} to your project.`,
	];

	parts.push(`    Updated ${pc.green(result.updatedFiles.length)} files.`);

	if (result.updatedPaths) {
		parts.push(`    Updated ${pc.green(Object.keys(result.updatedPaths).length)} paths.`);
	}

	if (result.updatedDependencies.length > 0) {
		parts.push(`    Updated ${pc.green(result.updatedDependencies.length)} dependencies.`);
	}

	if (result.updatedEnvVars) {
		parts.push(
			`    Updated ${pc.green(Object.keys(result.updatedEnvVars).length)} environment variables.`
		);
	}

	return parts.join('\n');
}
