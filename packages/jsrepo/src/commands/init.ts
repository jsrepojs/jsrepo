import { cancel, confirm, isCancel, log, multiselect, text } from '@clack/prompts';
import { Command } from 'commander';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import { z } from 'zod';
import pkg from '@/../package.json';
import {
	commonOptions,
	defaultCommandOptionsSchema,
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import { DEFAULT_PROVIDERS } from '@/providers';
import {
	getPathsForItems,
	normalizeItemTypeForPath,
	prepareUpdates,
	type ResolvedRegistry,
	resolveAndFetchAllItems,
	resolveRegistries,
	updateFiles,
} from '@/utils/add';
import type { DependencyKey, RemoteDependency } from '@/utils/build';
import type { Config, RegistryPlugin } from '@/utils/config';
import {
	addPluginsToConfig,
	neededPlugins,
	type Plugin,
	parsePluginName,
} from '@/utils/config/mods/add-plugins';
import { addRegistriesToConfig } from '@/utils/config/mods/add-registries';
import { updateConfigPaths } from '@/utils/config/mods/update-paths';
import { loadConfig, loadConfigSearch } from '@/utils/config/utils';
import {
	AlreadyInitializedError,
	type CLIError,
	type ConfigObjectNotFoundError,
	type CouldNotFindJsrepoImportError,
	type InvalidKeyTypeError,
	type InvalidPluginError,
	NoPackageJsonFoundError,
} from '@/utils/errors';
import { readFileSync, writeFileSync } from '@/utils/fs';
import { tryGetPackage } from '@/utils/package';
import { joinAbsolute } from '@/utils/path';
import {
	initLogging,
	intro,
	outro,
	promptAddEnvVars,
	promptInstallDependencies,
	promptInstallDependenciesByEcosystem,
} from '@/utils/prompts';
import type { AbsolutePath } from '@/utils/types';

export const schema = defaultCommandOptionsSchema.extend({
	yes: z.boolean(),
	overwrite: z.boolean(),
	verbose: z.boolean(),
	expand: z.boolean(),
	maxUnchanged: z.number(),
	js: z.boolean(),
});

export type InitOptions = z.infer<typeof schema>;

export const init = new Command('init')
	.description('Initialize a new jsrepo project.')
	.argument('[registries...]', 'The registries to initialize.')
	.option(
		'--js',
		'Initialize the project and automatically add the @jsrepo/transform-javascript transform plugin.',
		false
	)
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.yes)
	.addOption(commonOptions.verbose)
	.addOption(commonOptions.overwrite)
	.addOption(commonOptions.expand)
	.addOption(commonOptions.maxUnchanged)
	.action(async (registries, rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: false,
		});

		intro();

		await tryCommand(
			runInit(
				registries,
				// this way if the config is found in a higher directory we base everything off of that directory
				{
					...options,
					cwd: configResult
						? (path.dirname(configResult.path) as AbsolutePath)
						: options.cwd,
				},
				configResult
			)
		);

		outro(pc.green('Initialization complete!'));
	});

export async function runInit(
	registriesArg: string[],
	options: InitOptions,
	configResult: { config: Config; path: AbsolutePath } | null
): Promise<Result<void, CLIError>> {
	const { verbose, spinner } = initLogging({ options });

	verbose(`Starting init command with ${registriesArg.length} registry/registries: ${registriesArg.join(', ') || '(none)'}`);
	verbose(`Working directory: ${options.cwd}`);
	verbose(`Config found: ${configResult ? `yes (${configResult.path})` : 'no'}`);
	verbose(`Options: overwrite=${options.overwrite}, expand=${options.expand}, maxUnchanged=${options.maxUnchanged}, js=${options.js}`);

	const packagePath = joinAbsolute(options.cwd, 'package.json');

	const packageJsonResult = tryGetPackage(packagePath);
	if (packageJsonResult.isErr()) return err(new NoPackageJsonFoundError());
	const packageJson = packageJsonResult.value;
	verbose(`Found package.json: ${packagePath}`);
	verbose(`Package type: ${packageJson.type || 'commonjs'}`);

	let { config, path: configPath } = configResult ?? {
		config: null,
		path: joinAbsolute(
			options.cwd,
			packageJson.type === 'module' ? 'jsrepo.config.ts' : 'jsrepo.config.mts'
		),
	};
	verbose(`Config path: ${configPath}`);
	const providers = config?.providers ?? DEFAULT_PROVIDERS;
	verbose(`Using ${providers.length} provider(s): ${providers.map(p => p.name).join(', ')}`);

	let configCode: string;
	if (config === null) {
		verbose(`No existing config found, creating blank config`);
		configCode = initBlankConfig();
	} else {
		verbose(`Reading existing config from ${configPath}`);
		const configCodeResult = readFileSync(configPath);
		if (configCodeResult.isErr()) return err(configCodeResult.error);
		configCode = configCodeResult.value;
	}

	let hasJsrepo = true;
	if (
		packageJson.dependencies?.jsrepo === undefined &&
		packageJson.devDependencies?.jsrepo === undefined
	) {
		verbose(`jsrepo not found in dependencies, adding to devDependencies`);
		if (!packageJson.devDependencies) {
			packageJson.devDependencies = {};
		}
		packageJson.devDependencies.jsrepo = `^${pkg.version}`;

		const writePackageJsonResult = writeFileSync(
			packagePath,
			JSON.stringify(packageJson, null, '\t')
		);
		if (writePackageJsonResult.isErr()) return err(writePackageJsonResult.error);
		hasJsrepo = false;
	} else {
		verbose(`jsrepo already in dependencies`);
	}

	if (options.js) {
		verbose(`--js flag: adding @jsrepo/transform-javascript transform plugin`);
		const addPluginsToConfigResult = await addPluginsToConfig({
			plugins: [
				{
					name: 'stripTypes',
					packageName: '@jsrepo/transform-javascript',
					version: undefined,
				},
			],
			key: 'transforms',
			config: { path: configPath, code: configCode },
		});
		if (addPluginsToConfigResult.isErr()) return err(addPluginsToConfigResult.error);
		configCode = addPluginsToConfigResult.value;
	}

	if (registriesArg.length === 0) {
		if (config !== null) return err(new AlreadyInitializedError());

		verbose(`No registries specified, writing config and exiting`);
		const writeConfigResult = writeFileSync(configPath, configCode);
		if (writeConfigResult.isErr()) return err(writeConfigResult.error);

		log.success(`Wrote config to ${pc.cyan(path.relative(options.cwd, configPath))}`);
		verbose(`Config written successfully`);

		if (!hasJsrepo) {
			await promptInstallDependencies(
				{
					dependencies: [],
					devDependencies: [
						...(options.js
							? [
									{
										name: '@jsrepo/transform-javascript',
									},
								]
							: []),
					],
				},
				{ configPath, options }
			);
		}
		return ok();
	}

	const registries = registriesArg.length > 0 ? registriesArg : (config?.registries ?? []);
	verbose(`Initializing with ${registries.length} registry/registries: ${registries.join(', ')}`);

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

	const pluginChoices = new Map<string, { install: boolean; plugin: Plugin }>();
	for (const [_, resolved] of resolvedRegistries) {
		verbose(`Initializing registry: ${resolved.url}`);
		const initRegistryResult = await initRegistry(resolved, {
			configCode,
			configPath,
			options,
			pluginChoices,
			config,
			verbose,
		});
		if (initRegistryResult.isErr()) return err(initRegistryResult.error);
		configCode = initRegistryResult.value;
		verbose(`Registry ${resolved.url} initialized successfully`);
	}

	verbose(`Adding registries to config`);
	const addRegistriesToConfigResult = await addRegistriesToConfig(registriesArg, {
		config: { path: configPath, code: configCode },
	});
	if (addRegistriesToConfigResult.isErr()) return err(addRegistriesToConfigResult.error);
	configCode = addRegistriesToConfigResult.value;

	const writeConfigResult = writeFileSync(configPath, configCode);
	if (writeConfigResult.isErr()) return err(writeConfigResult.error);

	log.success(`Wrote config to ${pc.cyan(path.relative(options.cwd, configPath))}`);
	verbose(`Config written successfully`);

	const neededDeps = new Map<DependencyKey, RemoteDependency>(
		Array.from(pluginChoices.values())
			.filter((plugin) => plugin.install)
			.map(
				(plugin) =>
					[
						`js:${plugin.plugin.packageName}@${plugin.plugin.version ?? ''}`,
						{
							name: plugin.plugin.packageName,
							version: plugin.plugin.version,
							ecosystem: 'js',
						},
					] as [DependencyKey, RemoteDependency]
			)
	);

	verbose(`Found ${neededDeps.size} plugin dependency/dependencies to install`);
	if (neededDeps.size > 0) {
		await promptInstallDependencies(
			{
				dependencies: [],
				devDependencies: [
					...Array.from(neededDeps.values()),
					...(options.js
						? [
								{
									name: '@jsrepo/transform-javascript',
								},
							]
						: []),
				],
			},
			{
				options: { yes: true },
				configPath,
			}
		);
	}

	neededDeps.clear();

	const parsedPath = path.parse(configPath);
	verbose(`Reloading config to get updated state`);
	const loadConfigResult = await loadConfig({ cwd: parsedPath.dir });
	if (loadConfigResult.isErr()) return err(loadConfigResult.error);
	config = loadConfigResult.value;

	const itemsToAdd = Array.from(resolvedRegistries.values()).flatMap((registry) =>
		registry.manifest.items
			.filter((item) => item.add === 'on-init')
			.map((item) => ({ registry, item }))
		);
	verbose(`Found ${itemsToAdd.length} item(s) marked for 'on-init'`);

	const optionallyOnInitItems = Array.from(resolvedRegistries.values()).flatMap((registry) =>
		registry.manifest.items
			.filter((item) => item.add === 'optionally-on-init')
			.map((item) => ({ registry, item }))
		);
	verbose(`Found ${optionallyOnInitItems.length} item(s) marked for 'optionally-on-init'`);

	if (optionallyOnInitItems.length > 0) {
		const response = await multiselect({
			message: `Would you like to add any of the following items?`,
			options: optionallyOnInitItems.map((item) => ({
				label: item.item.name,
				value: item.item.name,
			})),
		});

		if (isCancel(response)) {
			cancel('Canceled!');
			process.exit(0);
		}

		itemsToAdd.push(
			...optionallyOnInitItems.filter((item) => response.includes(item.item.name))
		);
		verbose(`User selected ${response.length} optional item(s), total items to add: ${itemsToAdd.length}`);
	}

	const neededDependencies: {
		dependencies: RemoteDependency[];
		devDependencies: RemoteDependency[];
	} = { dependencies: [], devDependencies: [] };
	if (itemsToAdd.length > 0) {
		verbose(`Adding ${itemsToAdd.length} item(s) marked for initialization`);
		spinner.start(
			`Fetching ${pc.cyan(itemsToAdd.map((item) => item.item.name).join(', '))}...`
		);

		const itemsResult = await resolveAndFetchAllItems(itemsToAdd, {
			options: { withExamples: false, withDocs: false, withTests: false },
		});
		if (itemsResult.isErr()) {
			spinner.stop('Failed to fetch items');
			return err(itemsResult.error);
		}
		spinner.stop(`Fetched ${pc.cyan(itemsToAdd.map((item) => item.item.name).join(', '))}`);
		const items = itemsResult.value;

		const itemPathsResult = await getPathsForItems({ items, config, options });
		if (itemPathsResult.isErr()) return err(itemPathsResult.error);
		const { itemPaths, resolvedPaths } = itemPathsResult.value;
		verbose(`Resolved paths for ${Object.keys(itemPaths).length} item(s)`);

		const prepareUpdatesResult = await prepareUpdates({
			configResult: { path: configPath, config },
			options: {
				cwd: options.cwd,
				yes: options.yes,
				withExamples: false,
				withDocs: false,
				withTests: false,
			},
			itemPaths,
			resolvedPaths,
			items,
		});
		if (prepareUpdatesResult.isErr()) return err(prepareUpdatesResult.error);
		const {
			neededDependencies: neededDeps,
			neededEnvVars,
			neededFiles,
			updatedPaths,
		} = prepareUpdatesResult.value;
		verbose(`Prepared updates: ${neededFiles.length} file(s), ${neededDeps.dependencies.length + neededDeps.devDependencies.length} dependency/dependencies, ${neededEnvVars ? Object.keys(neededEnvVars).length : 0} env var(s)`);

		const updatedFilesResult = await updateFiles({ files: neededFiles, options });
		if (updatedFilesResult.isErr()) return err(updatedFilesResult.error);
		const updatedFiles = updatedFilesResult.value;
		verbose(`Updated ${updatedFiles.length} file(s): ${updatedFiles.join(', ')}`);

		log.success(`Updated ${pc.green(updatedFiles.length)} files`);

		if (neededEnvVars) {
			const updatedEnvVars = await promptAddEnvVars(neededEnvVars, { options });

			if (updatedEnvVars) {
				log.success(
					`Updated ${pc.green(Object.keys(updatedEnvVars).length)} environment variables`
				);
			}
		}

		if (updatedPaths) config.paths = updatedPaths;
		neededDeps.dependencies.push(...neededDependencies.dependencies);
		neededDeps.devDependencies.push(...neededDependencies.devDependencies);
	}

	if (config.paths !== undefined) {
		verbose(`Updating config paths: ${Object.keys(config.paths).join(', ')}`);
		const updateConfigPathsResult = await updateConfigPaths(config.paths, {
			config: { path: configPath, code: configCode },
		});
		if (updateConfigPathsResult.isErr()) return err(updateConfigPathsResult.error);
		configCode = updateConfigPathsResult.value;

		const writeConfigResult = writeFileSync(configPath, configCode);
		if (writeConfigResult.isErr()) return err(writeConfigResult.error);

		log.success(`Updated paths`);
		verbose(`Config paths updated successfully`);
	}

	verbose(`Installing dependencies: ${neededDependencies.dependencies.length} dependency/dependencies, ${neededDependencies.devDependencies.length} dev dependency/dependencies`);
	await promptInstallDependenciesByEcosystem(neededDependencies, { options, config });

	verbose(`Init command completed successfully`);
	return ok();
}

async function initRegistry(
	registry: ResolvedRegistry,
	{
		configCode,
		configPath,
		options,
		pluginChoices,
		config,
		verbose,
	}: {
		configCode: string;
		configPath: AbsolutePath;
		options: InitOptions;
		pluginChoices: Map<string, { install: boolean; plugin: Plugin }>;
		config: Config | null;
		verbose: (msg: string) => void;
	}
): Promise<
	Result<string, InvalidKeyTypeError | ConfigObjectNotFoundError | CouldNotFindJsrepoImportError>
> {
	verbose(`Initializing plugins for registry ${registry.url}`);
	const initPluginsResult = await initPlugins(registry, {
		configCode,
		configPath,
		options,
		pluginChoices,
		verbose,
	});
	if (initPluginsResult.isErr()) return err(initPluginsResult.error);
	configCode = initPluginsResult.value;

	verbose(`Initializing default paths for registry ${registry.url}`);
	const initDefaultPathsResult = await initDefaultPaths(registry, {
		configCode,
		configPath,
		options,
		config,
	});
	if (initDefaultPathsResult.isErr()) return err(initDefaultPathsResult.error);
	configCode = initDefaultPathsResult.value;

	return ok(configCode);
}

async function initPlugins(
	registry: ResolvedRegistry,
	{
		configCode,
		configPath,
		options,
		pluginChoices,
		verbose,
	}: {
		configCode: string;
		configPath: AbsolutePath;
		options: InitOptions;
		pluginChoices: Map<string, { install: boolean; plugin: Plugin }>;
		verbose: (msg: string) => void;
	}
): Promise<
	Result<string, InvalidKeyTypeError | ConfigObjectNotFoundError | CouldNotFindJsrepoImportError>
> {
	if (!registry.manifest.plugins) {
		verbose(`No plugins required for registry ${registry.url}`);
		return ok(configCode);
	}
	verbose(`Processing ${Object.keys(registry.manifest.plugins).length} plugin type(s) for registry ${registry.url}`);

	for (const [key, plugins] of Object.entries(registry.manifest.plugins)) {
		verbose(`Processing ${plugins.length} plugin(s) for type: ${key}`);
		const getWantedPluginsResult = await getWantedPlugins(plugins, {
			pluginChoices,
			options,
			type: key.slice(0, -1) as never,
			config: { path: configPath, code: configCode },
		});
		if (getWantedPluginsResult.isErr()) return err(getWantedPluginsResult.error);
		const wantedPlugins = getWantedPluginsResult.value;
		verbose(`Selected ${wantedPlugins.length} plugin(s) to add for type ${key}`);
		const addPluginsToConfigResult = await addPluginsToConfig({
			plugins: wantedPlugins,
			key: key as keyof typeof registry.manifest.plugins,
			config: { path: configPath, code: configCode },
		});
		if (addPluginsToConfigResult.isErr()) return err(addPluginsToConfigResult.error);
		configCode = addPluginsToConfigResult.value;
	}

	return ok(configCode);
}

async function initDefaultPaths(
	registry: ResolvedRegistry,
	{
		configCode,
		configPath,
		config,
		options,
	}: {
		configCode: string;
		configPath: string;
		config: Config | null;
		options: InitOptions;
	}
) {
	const types = Array.from(
		new Set(
			registry.manifest.items.flatMap((item) =>
				item.files
					.filter((file) => file.target === undefined)
					.map((file) => normalizeItemTypeForPath(file.type))
			)
		)
	);

	let paths = config?.paths ?? {};

	if (!options.yes && types.length > 0) {
		const configurePaths = await multiselect({
			message: 'Which paths would you like to configure?',
			options: types.map((type) => ({
				label: type,
				value: type,
				hint: registry.manifest.defaultPaths?.[type]
					? `Default: ${registry.manifest.defaultPaths?.[type]}`
					: undefined,
			})),
			required: false,
		});

		if (isCancel(configurePaths)) {
			cancel('Canceled!');
			process.exit(0);
		}

		if (configurePaths.length > 0) {
			for (const type of configurePaths) {
				const configuredValue = paths[type] ?? registry.manifest.defaultPaths?.[type];

				const categoryPath = await text({
					message: `Where should ${type} be added in your project?`,
					validate(value) {
						if (!value || value.trim() === '') return 'Please provide a value';
					},
					placeholder: configuredValue ? configuredValue : `./src/${type}`,
					defaultValue: configuredValue,
					initialValue: configuredValue,
				});

				if (isCancel(categoryPath)) {
					cancel('Canceled!');
					process.exit(0);
				}

				paths[type] = categoryPath;
			}
		}
	}

	paths = {
		...registry.manifest.defaultPaths,
		...paths,
	};

	return await updateConfigPaths(paths, { config: { path: configPath, code: configCode } });
}

async function getWantedPlugins(
	plugins: RegistryPlugin[],
	{
		pluginChoices,
		options,
		type,
		config,
	}: {
		pluginChoices: Map<string, { install: boolean; plugin: Plugin }>;
		options: InitOptions;
		type: 'provider' | 'transform' | 'language';
		config: { path: AbsolutePath; code: string };
	}
): Promise<Result<Plugin[], InvalidPluginError>> {
	const wantedPlugins: Plugin[] = [];
	const addPlugin = (plugin: Plugin, install: boolean) => {
		pluginChoices.set(plugin.packageName, { install, plugin });
		wantedPlugins.push(plugin);
	};
	const unAddedPlugins = await neededPlugins({ config, plugins });
	for (const plugin of unAddedPlugins) {
		if (pluginChoices.has(plugin.package)) continue;
		const parsePluginNameResult = parsePluginName(plugin.package, type);
		if (parsePluginNameResult.isErr()) return err(parsePluginNameResult.error);
		const pluginName = parsePluginNameResult.value.name;
		const mappedPlugin: Plugin = {
			name: pluginName,
			packageName: plugin.package,
			version: plugin.version,
		};
		if (plugin.optional !== true) {
			addPlugin(mappedPlugin, true);
			continue;
		}

		let shouldAddPlugin = options.yes;
		if (!options.yes) {
			const response = await confirm({
				message: `Would you like to add the ${pc.cyan(plugin.package)} ${type} plugin?`,
			});

			if (isCancel(response)) {
				cancel('Canceled!');
				process.exit(0);
			}

			shouldAddPlugin = response;
		}

		if (!shouldAddPlugin) {
			pluginChoices.set(plugin.package, { install: false, plugin: mappedPlugin });
			continue;
		}

		addPlugin(mappedPlugin, true);
	}
	return ok(wantedPlugins);
}

function initBlankConfig() {
	return `import { defineConfig } from 'jsrepo';

export default defineConfig({
    // configure where stuff comes from here
    registries: [],
    // configure were stuff goes here
    paths: {},
});`;
}
