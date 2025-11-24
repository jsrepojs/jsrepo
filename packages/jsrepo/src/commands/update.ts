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
import { existsSync, readFileSync, writeFileSync } from '@/utils/fs';
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
	const { verbose: _, spinner } = initLogging({ options });

	const config = configResult?.config;
	const providers = config?.providers ?? DEFAULT_PROVIDERS;
	const registries = options.registry ? [options.registry] : (config?.registries ?? []);

	let resolvedWantedItems: ResolvedWantedItem[];
	if (itemsArg.length > 0) {
		const parsedWantedItemsResult = parseWantedItems(itemsArg, {
			providers,
			registries,
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
	} else {
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

		const allItems: ResolvedWantedItem[] = Array.from(resolvedRegistries.entries()).flatMap(
			([_, registry]) => {
				return registry.manifest.items
					.filter(
						(item) =>
							(item.add ?? 'when-added') === 'when-added' && item.name !== 'index'
					)
					.map((item) => ({ item, registry }));
			}
		);

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
			if (!itemPath) continue; // don't know where it is so we can't update it

			for (const file of item.files) {
				const filePath = getTargetPath(file, { itemPath: { path: itemPath }, options });
				if (!existsSync(filePath)) continue;
				updateCandidates.push({ item: { ...item, registry }, registry });
				break;
			}
		}

		if (updateCandidates.length === 0) return err(new NoItemsToUpdateError());

		if (options.all) {
			resolvedWantedItems = updateCandidates.map(({ item, registry }) => ({
				item,
				registry,
			}));
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

	const itemPathsResult = await getPathsForItems({ items, config, options });
	if (itemPathsResult.isErr()) return err(itemPathsResult.error);
	const { itemPaths, updatedPaths } = itemPathsResult.value;

	const prepareUpdatesResult = await prepareUpdates({
		configResult,
		options,
		itemPaths,
		items,
	});
	if (prepareUpdatesResult.isErr()) return err(prepareUpdatesResult.error);
	const { neededDependencies, neededEnvVars, neededFiles } = prepareUpdatesResult.value;

	const updatedFilesResult = await updateFiles({ files: neededFiles, options });
	if (updatedFilesResult.isErr()) return err(updatedFilesResult.error);
	const updatedFiles = updatedFilesResult.value;

	if (configResult && updatedPaths) {
		const configCodeResult = readFileSync(configResult.path);
		if (configCodeResult.isErr()) return err(configCodeResult.error);
		const configCode = configCodeResult.value;
		const updatedConfigCode = await updateConfigPaths(config?.paths ?? updatedPaths, {
			config: { path: configResult.path, code: configCode },
		});
		if (updatedConfigCode.isErr()) return err(updatedConfigCode.error);
		const writeResult = writeFileSync(configResult.path, updatedConfigCode.value);
		if (writeResult.isErr()) return err(writeResult.error);
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
