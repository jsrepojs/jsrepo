import { cancel, isCancel, multiselect } from '@clack/prompts';
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
	getTargetPath,
	type ItemDistributed,
	type ItemRepository,
	parseWantedItems,
	prepareUpdates,
	type ResolvedItem,
	type ResolvedRegistry,
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
import { type CLIError, ConfigNotFoundError, NoItemsToUpdateError } from '@/utils/errors';
import { existsSync, readFileSync } from '@/utils/fs';
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
	verbose: z.boolean(),
	registry: z.string().optional(),
	overwrite: z.boolean(),
	expand: z.boolean(),
	maxUnchanged: z.number(),
	withExamples: z.boolean(),
	withDocs: z.boolean(),
	withTests: z.boolean(),
});

export type UpdateOptions = z.infer<typeof schema>;

export const update = new Command('update')
	.description('Update items in your project.')
	.argument(
		'[items...]',
		'Names of the items you want to update. ex: (math, github/ieedan/std/math)'
	)
	.option('--registry <registry>', 'The registry to update items from.', undefined)
	.option('--all', 'Update all items in the project.', false)
	.option('--with-examples', 'Include examples in the update.', false)
	.option('--with-docs', 'Include docs in the update.', false)
	.option('--with-tests', 'Include tests in the update.', false)
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
		if (!config) error(new ConfigNotFoundError(options.cwd));

		const result = await tryCommand(
			runUpdate(
				blockNames,
				// this way if the config is found in a higher directory we base everything off of that directory
				{ ...options, cwd: path.dirname(config.path) as AbsolutePath },
				config
			)
		);

		outro(formatResult(result));
	});

export type UpdateCommandResult = {
	items: (ItemRepository | ItemDistributed)[];
	updatedFiles: string[];
	updatedDependencies: RemoteDependency[];
	updatedEnvVars: Record<string, string> | undefined;
	updatedPaths: Config['paths'] | undefined;
};

export async function runUpdate(
	itemsArg: string[],
	options: UpdateOptions,
	configResult: { path: AbsolutePath; config: Config } | null
): Promise<Result<UpdateCommandResult, CLIError>> {
	const { verbose, spinner } = initLogging({ options });

	const config = configResult?.config;
	verbose(`Starting update command with ${itemsArg.length} item(s): ${itemsArg.join(', ') || '(none)'}`);
	verbose(`Working directory: ${options.cwd}`);
	verbose(`Config found: ${configResult ? `yes (${configResult.path})` : 'no'}`);
	verbose(`Options: overwrite=${options.overwrite}, withExamples=${options.withExamples}, withDocs=${options.withDocs}, withTests=${options.withTests}, expand=${options.expand}, maxUnchanged=${options.maxUnchanged}, all=${options.all}`);

	const providers = config?.providers ?? DEFAULT_PROVIDERS;
	const registries = options.registry ? [options.registry] : (config?.registries ?? []);
	verbose(`Using ${providers.length} provider(s): ${providers.map(p => p.name).join(', ')}`);
	verbose(`Using ${registries.length} registry/registries: ${registries.join(', ') || '(none)'}`);

	let resolvedWantedItems: ResolvedWantedItem[];
	if (itemsArg.length > 0) {
		verbose(`Mode: updating specific ${itemsArg.length} item(s)`);
		const parsedWantedItemsResult = parseWantedItems(itemsArg, {
			providers,
			registries,
		});
		if (parsedWantedItemsResult.isErr()) return err(parsedWantedItemsResult.error);
		const { wantedItems, neededRegistries } = parsedWantedItemsResult.value;
		verbose(`Parsed ${wantedItems.length} wanted item(s), need ${neededRegistries.length} registry/registries: ${neededRegistries.join(', ')}`);

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
		verbose(`Resolved ${resolvedWantedItems.length} wanted item(s)`);
	} else {
		verbose(`Mode: ${options.all ? 'updating all items' : 'interactive selection'}`);
		spinner.start(
			`Retrieving manifest${registries.length > 1 ? 's' : ''} from ${pc.cyan(registries.join(', '))}`
		);

		const resolvedRegistriesResult = await resolveRegistries(registries, {
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
		verbose(`Successfully resolved ${resolvedRegistries.size} registry/registries`);

		const allItems: ResolvedWantedItem[] = Array.from(resolvedRegistries.entries()).flatMap(
			([_, registry]) => {
				return registry.manifest.items
					.filter((item) => (item.add ?? 'when-added') === 'when-added')
					.map((item) => ({ item, registry }));
			}
		);
		verbose(`Found ${allItems.length} item(s) marked for 'when-added' across all registries`);

		const itemPathsResult = await getPathsForItems({
			items: allItems.map((item) => ({
				name: item.item.name,
				type: item.item.type,
				files: item.item.files,
			})),
			config,
			options: {
				cwd: options.cwd,
				// make non interactive
				yes: true,
			},
			continueOnNoPath: true,
		});
		if (itemPathsResult.isErr()) return err(itemPathsResult.error);
		const { itemPaths } = itemPathsResult.value;

		const updateCandidates: {
			item: ResolvedItem;
			registry: ResolvedRegistry;
		}[] = [];
		for (const { item, registry } of allItems) {
			const itemPath = itemPaths[`${item.type}/${item.name}`]?.path;
			if (!itemPath) {
				verbose(`Skipping ${item.name}: no path found in config`);
				continue; // don't know where it is so we can't update it
			}

			for (const file of item.files) {
				const filePath = getTargetPath(file, { itemPath: { path: itemPath }, options });
				if (!existsSync(filePath)) continue;
				updateCandidates.push({ item: { ...item, registry }, registry });
				verbose(`Found update candidate: ${item.name} at ${itemPath}`);
				break;
			}
		}

		verbose(`Found ${updateCandidates.length} update candidate(s)`);
		if (updateCandidates.length === 0) return err(new NoItemsToUpdateError());

		if (options.all) {
			resolvedWantedItems = updateCandidates.map(({ item, registry }) => ({
				item,
				registry,
			}));
			verbose(`--all flag: updating all ${resolvedWantedItems.length} candidate(s)`);
		} else {
			const registryUrls = new Set<string>();
			for (const { registry } of updateCandidates) {
				registryUrls.add(registry.url);
			}
			const areDifferentRegistryUrls = registryUrls.size > 1;

			const selectedItems = await multiselect({
				message: 'Which items would you like to update?',
				options: updateCandidates.map(({ item }) => ({
					label: areDifferentRegistryUrls
						? `${item.registry.url}/${item.name}`
						: item.name,
					value: `${item.registry.url}/${item.name}`,
				})),
			});

			if (isCancel(selectedItems)) {
				cancel('Canceled!');
				process.exit(0);
			}

			resolvedWantedItems = updateCandidates.filter(({ item }) =>
				selectedItems.includes(`${item.registry.url}/${item.name}`)
			);
			verbose(`User selected ${resolvedWantedItems.length} item(s) to update`);
		}
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
	verbose(`Fetched ${items.length} item(s) successfully`);

	const itemPathsResult = await getPathsForItems({ items, config, options });
	if (itemPathsResult.isErr()) return err(itemPathsResult.error);
	const { itemPaths, resolvedPaths } = itemPathsResult.value;
	verbose(`Resolved paths for ${Object.keys(itemPaths).length} item(s)`);
	if (resolvedPaths) {
		verbose(`Resolved ${Object.keys(resolvedPaths).length} path configuration(s)`);
	}

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
	verbose(`Prepared updates: ${neededFiles.length} file(s), ${neededDependencies.dependencies.length + neededDependencies.devDependencies.length} dependency/dependencies, ${neededEnvVars ? Object.keys(neededEnvVars).length : 0} env var(s)`);
	if (neededDependencies.dependencies.length > 0) {
		verbose(`Dependencies: ${neededDependencies.dependencies.map(d => `${d.name}@${d.version || 'latest'}`).join(', ')}`);
	}
	if (neededDependencies.devDependencies.length > 0) {
		verbose(`Dev dependencies: ${neededDependencies.devDependencies.map(d => `${d.name}@${d.version || 'latest'}`).join(', ')}`);
	}
	if (neededEnvVars) {
		verbose(`Environment variables: ${Object.keys(neededEnvVars).join(', ')}`);
	}

	const updatedFilesResult = await updateFiles({ files: neededFiles, options });
	if (updatedFilesResult.isErr()) return err(updatedFilesResult.error);
	const updatedFiles = updatedFilesResult.value;
	verbose(`Updated ${updatedFiles.length} file(s): ${updatedFiles.join(', ')}`);

	if (configResult && updatedPaths) {
		verbose(`Updating config paths: ${Object.keys(updatedPaths).join(', ')}`);
		const configCodeResult = readFileSync(configResult.path);
		if (configCodeResult.isErr()) return err(configCodeResult.error);
		const configCode = configCodeResult.value;
		await updateConfigPaths(updatedPaths, {
			config: { path: configResult.path, code: configCode },
		});
		verbose(`Config paths updated successfully`);
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
	verbose(`Installed ${updatedDependencies.length} dependency/dependencies`);

	verbose(`Update command completed successfully`);
	return ok({
		items,
		updatedDependencies,
		updatedEnvVars,
		updatedFiles,
		updatedPaths,
	});
}

function formatResult(result: UpdateCommandResult): string {
	const parts: string[] = [
		`Updated ${pc.cyan(result.items.map((item) => item.name).join(', '))} in your project.`,
	];

	parts.push(`    Updated ${pc.green(result.updatedFiles.length)} files.`);

	// paths will only ever be updated if an updated registry item depends on new items whose paths were not set previously
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
