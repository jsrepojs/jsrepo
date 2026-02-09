import {
	type AutocompleteMultiSelectOptions,
	autocompleteMultiselect,
	cancel,
	isCancel,
} from '@clack/prompts';
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
import { readFileSync, writeFileSync } from '@/utils/fs';
import {
	initLogging,
	intro,
	outro,
	promptAddEnvVars,
	promptInstallDependenciesByEcosystem,
} from '@/utils/prompts';
import { resolveWithRoles } from '@/utils/roles';
import type { AbsolutePath } from '@/utils/types';

export const schema = defaultCommandOptionsSchema.extend({
	yes: z.boolean(),
	all: z.boolean(),
	overwrite: z.boolean(),
	verbose: z.boolean(),
	registry: z.string().optional(),
	with: z.array(z.string()).default([]),
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
	.option('--with <roles...>', 'Include files with the given roles.')
	.option('--with-examples', 'Deprecated. Use --with example.', false)
	.option('--with-docs', 'Deprecated. Use --with doc.', false)
	.option('--with-tests', 'Deprecated. Use --with test.', false)
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
	updatedDependencies: {
		installed: boolean;
		dependencies: RemoteDependency[];
	};
	updatedEnvVars: Record<string, string> | undefined;
	updatedPaths: Config['paths'] | undefined;
};

export async function runAdd(
	itemsArg: string[],
	options: AddOptions,
	configResult: { path: AbsolutePath; config: Config } | null
): Promise<Result<AddCommandResult, CLIError>> {
	const { verbose: _, spinner } = initLogging({ options });
	const withRoles = resolveWithRoles(options);

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
			const multiSelectOptions: AutocompleteMultiSelectOptions<`${string}/${string}`>['options'] =
				possibleItems
					.filter(
						(item) =>
							(item.item.add ?? 'when-added') === 'when-added' &&
							item.item.name !== 'index'
					)
					.map((item) => {
						const value = `${item.registry.url}/${item.item.name}` as const;
						const label =
							resolvedRegistries.size > 1
								? `${pc.cyan(item.registry.url)}/${item.item.name}`
								: item.item.name;

						return {
							label: label,
							value: value,
							hint:
								(item.item.description?.length ??
								0 >= process.stdout.columns - label.length - 12)
									? `${item.item.description
											?.slice(0, process.stdout.columns - label.length - 12)
											.trim()}...`
									: item.item.description,
						};
					});

			const userSelections = await autocompleteMultiselect({
				message: 'Which items would you like to add?',
				options: multiSelectOptions,
				maxItems: process.stdout.rows - 10,
				required: true,
			});

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

	const itemsResult = await resolveAndFetchAllItems(resolvedWantedItems, {
		options: { withRoles },
	});
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
		options: { cwd: options.cwd, yes: options.yes, withRoles },
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

function formatResult(result: AddCommandResult): string {
	const parts: string[] = [
		`Added ${pc.cyan(result.items.map((item) => item.name).join(', '))} to your project.`,
	];

	if (result.updatedFiles.length > 0) {
		parts.push(
			`    Updated ${pc.green(result.updatedFiles.length)} ${
				result.updatedFiles.length === 1 ? 'file' : 'files'
			}.`
		);
	}

	if (result.updatedPaths && Object.keys(result.updatedPaths).length > 0) {
		parts.push(
			`    Updated ${pc.green(Object.keys(result.updatedPaths).length)} ${
				Object.keys(result.updatedPaths).length === 1 ? 'path' : 'paths'
			}.`
		);
	}

	if (result.updatedDependencies.dependencies.length > 0) {
		if (result.updatedDependencies.installed) {
			parts.push(
				`    Installed ${pc.green(result.updatedDependencies.dependencies.length)} ${
					result.updatedDependencies.dependencies.length === 1
						? 'dependency'
						: 'dependencies'
				}.`
			);
		} else {
			parts.push(
				`    Skipped installation of ${pc.cyan(
					result.updatedDependencies.dependencies
						.map((dep) => `${dep.name}${dep.version ? `@${dep.version}` : ''}`)
						.join(', ')
				)}.`
			);
		}
	}

	if (result.updatedEnvVars && Object.keys(result.updatedEnvVars).length > 0) {
		parts.push(
			`    Updated ${pc.green(Object.keys(result.updatedEnvVars).length)} ${
				Object.keys(result.updatedEnvVars).length === 1
					? 'environment variable'
					: 'environment variables'
			}.`
		);
	}

	return parts.join('\n');
}
