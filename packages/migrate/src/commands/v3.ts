import { existsSync } from 'node:fs';
import { cancel, confirm, isCancel, log, text } from '@clack/prompts';
import { Command } from 'commander';
import type { RegistryConfig, RegistryItem, RegistryItemFile } from 'jsrepo/config';
import { DEFAULT_PROVIDERS } from 'jsrepo/providers';
import { resolveRegistries } from 'jsrepo/utils';
import { err, ok, type Result } from 'nevereverthrow';
import { detect, resolveCommand } from 'package-manager-detector';
import path from 'pathe';
import pc from 'picocolors';
import { z } from 'zod';
import {
	commonOptions,
	defaultCommandOptionsSchema,
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import {
	type CLIError,
	InvalidJSONError,
	JsrepoError,
	ManifestNotFoundError,
	NoPackageJsonFoundError,
} from '@/utils/errors';
import { readFileSync, rmSync, writeFileSync } from '@/utils/fs';
import { stringify } from '@/utils/json';
import { type PackageJson, tryGetPackage } from '@/utils/package';
import { joinAbsolute } from '@/utils/path';
import { installDependencies, intro, outro, runCommands } from '@/utils/prompts';
import type { AbsolutePath } from '@/utils/types';
import {
	isDocsFile,
	isTestFile,
	MANIFEST_FILE_V2,
	ManifestSchemaV2,
	PROJECT_CONFIG_FILE_V2,
	ProjectConfigSchemaV2,
	type ProjectConfigV2,
	REGISTRY_CONFIG_FILE_V2,
	RegistryConfigSchemaV2,
	type RegistryConfigV2,
} from '@/utils/v2/config';
import { safeParseFromJSON } from '@/utils/zod';

export const schema = defaultCommandOptionsSchema.extend({
	yes: z.boolean(),
	verbose: z.boolean(),
	overwrite: z.boolean(),
});

export type V3Options = z.infer<typeof schema>;

export const v3 = new Command('v3')
	.description('Migrate your jsrepo config to v3.')
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.yes)
	.addOption(commonOptions.verbose)
	.addOption(commonOptions.overwrite)
	.action(async (rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		intro();

		const result = await tryCommand(runV3(options));

		outro('Successfully migrated to jsrepo v3.');

		if (result.migratedConfigs.registry !== null) {
			process.stdout.write(pc.green('   Next steps:\n\n'));
			process.stdout.write(
				`   ${pc.gray('1.')} Update documentation for the \`jsrepo add\` command ${pc.gray(
					`\`jsrepo add <category>/<item>\``
				)} -> ${pc.cyan(`\`jsrepo add <item>\``)}\n`
			);
			process.stdout.write(
				`   ${pc.gray('2.')} Add descriptions to registry items (optional)\n`
			);
			process.stdout.write(
				`   ${pc.gray('3.')} Checkout the new docs to learn more! ${pc.cyan(`https://v3.jsrepo.dev`)}\n`
			);
			process.stdout.write('\n');
		}
	});

export type V3CommandResult = {
	configPath: string;
	migratedConfigs: {
		registry: { oldConfig: RegistryConfigV2; newConfig: RegistryConfig } | null;
		project: {
			oldConfig: ProjectConfigV2;
			newConfig: { registries: string[]; paths: Record<string, string> };
		} | null;
	};
};

export async function runV3(options: V3Options): Promise<Result<V3CommandResult, CLIError>> {
	const packagePath = joinAbsolute(options.cwd, 'package.json');
	const packageJsonResult = tryGetPackage(packagePath);
	if (packageJsonResult.isErr()) return err(new NoPackageJsonFoundError());
	const packageJson = packageJsonResult.value;

	const oldRegistryConfigPath = joinAbsolute(options.cwd, REGISTRY_CONFIG_FILE_V2);
	let oldRegistryConfig: RegistryConfigV2 | null;
	if (existsSync(oldRegistryConfigPath)) {
		const oldConfigResult = readFileSync(oldRegistryConfigPath);
		if (oldConfigResult.isErr()) return err(oldConfigResult.error);
		const oldConfigParseResult = safeParseFromJSON(
			RegistryConfigSchemaV2,
			oldConfigResult.value
		);
		if (oldConfigParseResult.isErr())
			return err(new InvalidJSONError(oldConfigParseResult.error));
		oldRegistryConfig = oldConfigParseResult.value;
	} else {
		oldRegistryConfig = null;
	}

	const oldProjectConfigPath = joinAbsolute(options.cwd, PROJECT_CONFIG_FILE_V2);
	let oldProjectConfig: ProjectConfigV2 | null;
	if (existsSync(oldProjectConfigPath)) {
		const oldConfigResult = readFileSync(oldProjectConfigPath);
		if (oldConfigResult.isErr()) return err(oldConfigResult.error);
		const oldConfigParseResult = safeParseFromJSON(
			ProjectConfigSchemaV2,
			oldConfigResult.value
		);
		if (oldConfigParseResult.isErr())
			return err(new InvalidJSONError(oldConfigParseResult.error));
		oldProjectConfig = oldConfigParseResult.value;
	} else {
		oldProjectConfig = null;
	}

	if (oldRegistryConfig === null && oldProjectConfig === null) {
		return err(
			new JsrepoError(`No configs to migrate at ${path.resolve(options.cwd)}!`, {
				suggestion:
					'Please ensure you are running this command in the root of your jsrepo project.',
			})
		);
	}

	let registryConfig: RegistryConfig | null = null;
	if (oldRegistryConfig !== null) {
		const registryItemsResult = await migrateRegistryConfig({
			packageJson,
			oldConfigPath: oldRegistryConfigPath,
			oldConfig: oldRegistryConfig,
			options,
		});
		if (registryItemsResult.isErr()) return err(registryItemsResult.error);
		registryConfig = registryItemsResult.value;
	}

	let projectConfig: { registries: string[]; paths: Record<string, string> } | null = null;
	if (oldProjectConfig !== null) {
		const projectConfigResult = await migrateProjectConfig({
			oldConfig: oldProjectConfig,
			options,
		});
		if (projectConfigResult.isErr()) return err(projectConfigResult.error);
		projectConfig = projectConfigResult.value;
	}

	const neededDependencies: string[] = [
		'jsrepo@beta',
		...(oldProjectConfig?.formatter ? [`@jsrepo/transform-${oldProjectConfig.formatter}`] : []),
	];

	const newConfigCode = `import { defineConfig } from "jsrepo";${
		registryConfig
			? `\nimport { ${oldRegistryConfig?.outputDir ? `distributed` : `repository`} } from "jsrepo/outputs";`
			: ''
	}${
		oldProjectConfig?.formatter
			? `\nimport ${oldProjectConfig.formatter} from "@jsrepo/transform-${oldProjectConfig.formatter}";`
			: ''
	}
    
export default defineConfig({${
		registryConfig
			? `\n\tregistry: {
        name: "${registryConfig.name}",
		description: ${registryConfig.description ? `"${registryConfig.description}"` : undefined},
		homepage: ${registryConfig.homepage ? `"${registryConfig.homepage}"` : undefined},
		authors: ${stringify(registryConfig.authors, { format: true })},
		bugs: ${registryConfig.bugs ? `"${registryConfig.bugs}"` : undefined},
		repository: ${registryConfig.repository ? `"${registryConfig.repository}"` : undefined},
		tags: ${stringify(registryConfig.tags, { format: true })},
		version: ${registryConfig.version ? `"${registryConfig.version}"` : undefined},
		access: ${registryConfig.access ? `"${registryConfig.access}"` : undefined},
		defaultPaths: ${stringify(registryConfig.defaultPaths, { format: true })},
		excludeDeps: ${stringify(registryConfig.excludeDeps, { format: true })},
        outputs: [${
			oldRegistryConfig?.outputDir
				? `distributed({ dir: "${oldRegistryConfig.outputDir}" })`
				: `repository({ format: true })`
		}],
        items: ${stringify(registryConfig.items, { format: true })}
    },`
			: ''
	}${
		projectConfig
			? `\n\tregistries: ${stringify(projectConfig.registries, { format: true })},\n\tpaths: ${stringify(
					projectConfig.paths,
					{ format: true }
				)},${oldProjectConfig?.formatter ? `\n\ttransforms: [${oldProjectConfig.formatter}()],` : ''}`
			: ''
	}
});`;

	const newConfigPath = joinAbsolute(
		options.cwd,
		packageJson.type === 'module' ? 'jsrepo.config.ts' : 'jsrepo.config.cjs'
	);

	const writeNewConfigResult = writeFileSync(newConfigPath, newConfigCode);
	if (writeNewConfigResult.isErr()) return err(writeNewConfigResult.error);

	const newBuildCommand = resolveCommand(
		(await detect({ cwd: options.cwd }))?.agent ?? 'npm',
		'execute',
		['jsrepo@beta', 'build']
	);
	if (newBuildCommand === null)
		return err(
			new JsrepoError('Failed to resolve `jsrepo build` command', {
				suggestion:
					'Please ensure you can build your registry with the `jsrepo build` command.',
			})
		);

	await runCommands({
		title: 'Running `jsrepo build`',
		cwd: options.cwd,
		commands: [newBuildCommand],
		messages: {
			success: () => 'v3 Build completed successfully',
			error: () => {
				throw new JsrepoError('Failed to build registry', {
					suggestion:
						'The migration was successful, but the build failed. Please try again.',
				});
			},
		},
	});

	await installDependencies(
		{
			dependencies: [],
			devDependencies: neededDependencies,
		},
		{
			cwd: options.cwd,
		}
	);

	let deleteOldConfigs = options.yes;
	if (!options.yes) {
		const choice = await confirm({
			message: 'Remove old config files?',
			initialValue: true,
		});

		if (isCancel(choice)) {
			cancel('Canceled!');
			process.exit(0);
		}

		deleteOldConfigs = choice;
	}

	if (deleteOldConfigs) {
		if (oldRegistryConfig) {
			rmSync(oldRegistryConfigPath);
			rmSync(joinAbsolute(options.cwd, MANIFEST_FILE_V2));
		}
		if (oldProjectConfig) rmSync(oldProjectConfigPath);

		log.success('Removed old config files.');
	}

	return ok({
		configPath: path.relative(options.cwd, newConfigPath),
		migratedConfigs: {
			registry:
				!oldRegistryConfig || !registryConfig
					? null
					: { oldConfig: oldRegistryConfig, newConfig: registryConfig },
			project:
				!oldProjectConfig || !projectConfig
					? null
					: { oldConfig: oldProjectConfig, newConfig: projectConfig },
		},
	});
}

function getFileRole(file: string): RegistryItemFile['role'] {
	if (isTestFile(file)) return 'test';
	if (isDocsFile(file)) return 'doc';
	return undefined;
}

async function migrateProjectConfig({
	oldConfig,
	options,
}: {
	oldConfig: ProjectConfigV2;
	options: { cwd: AbsolutePath };
}): Promise<Result<{ registries: string[]; paths: Record<string, string> }, JsrepoError>> {
	if (oldConfig.repos.length > 0) {
		const resolvedRegistries = await resolveRegistries(oldConfig.repos, {
			cwd: options.cwd,
			providers: DEFAULT_PROVIDERS,
		});
		if (resolvedRegistries.isErr()) {
			log.warn(
				'There was an error resolving one or more of the registries in your project config. v2 registries are not compatible with jsrepo v3. Please ensure all the registries referenced by your config have upgraded to v3.'
			);
		}
	}

	return ok({
		registries: oldConfig.repos,
		paths: oldConfig.paths ?? {},
	});
}

async function migrateRegistryConfig({
	packageJson,
	oldConfigPath,
	oldConfig,
	options,
}: {
	packageJson: Partial<PackageJson>;
	oldConfigPath: AbsolutePath;
	oldConfig: RegistryConfigV2;
	options: { cwd: AbsolutePath };
}): Promise<Result<RegistryConfig, JsrepoError>> {
	const writeResult = writeFileSync(
		oldConfigPath,
		// remove outputDir to ensure we just output to the current directory
		stringify({ ...oldConfig, outputDir: undefined } satisfies RegistryConfigV2, {
			format: true,
		})
	);
	if (writeResult.isErr()) return err(writeResult.error);

	const oldBuildCommand = resolveCommand(
		(await detect({ cwd: options.cwd }))?.agent ?? 'npm',
		'execute',
		['jsrepo@2', 'build']
	);
	if (oldBuildCommand === null)
		return err(
			new JsrepoError('Failed to resolve `jsrepo build` command', {
				suggestion:
					'Please ensure you can build your registry with the `jsrepo build` command.',
			})
		);

	await runCommands({
		title: 'Running `jsrepo build`',
		cwd: options.cwd,
		commands: [oldBuildCommand],
		messages: {
			success: () => 'v2 Build completed successfully',
			error: () => {
				throw new JsrepoError('Failed to build registry', {
					suggestion:
						'Please ensure you can build your registry with the `jsrepo build` command.',
				});
			},
		},
	});

	const manifestPath = joinAbsolute(options.cwd, MANIFEST_FILE_V2);

	const manifestResult = readFileSync(manifestPath);
	if (manifestResult.isErr()) return err(new ManifestNotFoundError({ path: manifestPath }));
	const manifestParseResult = safeParseFromJSON(ManifestSchemaV2, manifestResult.value);
	if (manifestParseResult.isErr()) return err(new InvalidJSONError(manifestParseResult.error));
	const manifest = manifestParseResult.value;

	if (manifest.name === undefined) {
		const name = await text({
			message: 'Enter the name of your registry',
			validate(value) {
				if (!value || value.trim() === '') return 'Please provide a value';
			},
			initialValue: packageJson.name,
			defaultValue: packageJson.name,
			placeholder: packageJson.name,
		});

		if (isCancel(name)) {
			cancel('Canceled!');
			process.exit(0);
		}

		manifest.name = name;
	}

	const items: RegistryItem[] = [];

	for (const category of manifest.categories) {
		for (const block of category.blocks) {
			const item: RegistryItem = {
				name: block.name,
				add: block.list ? 'when-added' : 'when-needed',
				type: category.name,
				files: block.subdirectory
					? [
							{
								path: block.directory,
								files: block.files.map((file) => ({
									path: file,
									role: getFileRole(file),
								})),
							},
						]
					: block.files.map((file) => ({
							path: path.join(block.directory, file),
							role: getFileRole(file),
						})),
			};

			items.push(item);
		}
	}

	for (const configFile of manifest.configFiles ?? []) {
		const item: RegistryItem = {
			name: configFile.name,
			title: configFile.name,
			add: configFile.optional ? 'optionally-on-init' : 'on-init',
			type: 'config',
			files: [
				{
					path: configFile.path,
					target: configFile.expectedPath,
				},
			],
		};

		items.push(item);
	}

	return ok({
		name: manifest.name,
		description: manifest.meta?.description,
		homepage: manifest.meta?.homepage,
		authors: manifest.meta?.authors,
		bugs: manifest.meta?.bugs,
		repository: manifest.meta?.repository,
		tags: manifest.meta?.tags,
		version: manifest.version,
		access: manifest.access,
		defaultPaths: manifest.defaultPaths,
		excludeDeps: oldConfig.excludeDeps,
		items,
	});
}
