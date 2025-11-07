import fs from 'node:fs';
import { buffer } from 'node:stream/consumers';
import { createGzip } from 'node:zlib';
import { log } from '@clack/prompts';
import { Command } from 'commander';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import semver from 'semver';
import tar from 'tar-stream';
import { z } from 'zod';
import {
	commonOptions,
	defaultCommandOptionsSchema,
	error,
	forEachRegistry,
	hasRegistries,
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import type { DistributedOutputItem, DistributedOutputManifest } from '@/outputs/distributed';
import { DEFAULT_PROVIDERS } from '@/providers';
import { type jsrepo, NAME_REGEX } from '@/providers/jsrepo';
import { type BuildResult, buildRegistry, MANIFEST_FILE } from '@/utils/build';
import type { Config } from '@/utils/config';
import { loadConfigSearch } from '@/utils/config/utils';
import {
	type CLIError,
	ConfigNotFoundError,
	InvalidRegistryNameError,
	InvalidRegistryVersionError,
	JsrepoError,
	NoPackageJsonFoundError,
	NoProviderFoundError,
	NoRegistriesError,
} from '@/utils/errors';
import { findNearestPackageJson, type PackageJson } from '@/utils/package';
import { initLogging, intro, outro } from '@/utils/prompts';
import { TokenManager } from '@/utils/token-manager';

export const schema = defaultCommandOptionsSchema.extend({
	dryRun: z.boolean(),
	verbose: z.boolean(),
});

export type PublishOptions = z.infer<typeof schema>;

export const publish = new Command('publish')
	.description('Publish your registry to jsrepo.com.')
	.argument(
		'[registries...]',
		'One or more registries to publish. If not provided, publishes all registries.'
	)
	.option('--dry-run', 'Build the registry without publishing.', false)
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.verbose)
	.action(async (registries, rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: false,
		});
		if (!configResult) error(new ConfigNotFoundError(options.cwd));

		intro();

		const result = await tryCommand(
			runPublish(registries, {
				config: configResult.config,
				options: {
					...options,
					// this way if the config is found in a higher directory we base everything off of that directory
					cwd: configResult ? path.dirname(configResult.path) : options.cwd,
				},
			})
		);

		outro(formatResult(result));
	});

export type PublishCommandResult = {
	duration: number;
	dryRun: boolean;
	publishedRegistries: (
		| {
				skipped: true;
				name: string;
		  }
		| {
				skipped: false;
				name: string;
				version: string;
				result: Result<{ version: string; tag?: string }, CLIError>;
		  }
	)[];
};

type JsrepoProvider = ReturnType<typeof jsrepo>;

export async function runPublish(
	registries: string[],
	{ options, config }: { options: PublishOptions; config: Config }
): Promise<Result<PublishCommandResult, CLIError>> {
	const { verbose: _, spinner } = initLogging({ options });

	const publishStart = performance.now();

	if (options.dryRun) {
		log.warn(
			`${pc.bgYellow(pc.black(' DRY RUN '))} ${pc.dim('No registries will be published.')}`
		);
	}

	if (!hasRegistries(config)) return err(new NoRegistriesError());

	const providers = config.providers ?? DEFAULT_PROVIDERS;
	const jsrepoProvider = providers.find((p) => p.name === 'jsrepo') as JsrepoProvider | undefined;
	if (!jsrepoProvider) return err(new NoProviderFoundError('jsrepo'));

	const tokenManager = new TokenManager();
	const token = tokenManager.get(jsrepoProvider, undefined);
	if (!token) {
		return err(
			new JsrepoError('You need to be authenticated to publish your registry.', {
				suggestion: `Run ${pc.bold(`\`jsrepo auth jsrepo\``)} to authenticate or set the ${pc.bold(
					`JSREPO_TOKEN`
				)} environment variable.`,
			})
		);
	}

	const pkg = findNearestPackageJson(options.cwd);
	if (!pkg) return err(new NoPackageJsonFoundError());

	const buildStart = performance.now();

	spinner.start(
		`Building ${registries.length > 0 ? pc.cyan(registries.join(', ')) : 'all registries'}...`
	);

	const buildResults = await forEachRegistry<
		Result<
			{ skipped: true; name: string } | { skipped: false; buildResult: BuildResult },
			CLIError
		>
	>(
		config,
		async (registry) => {
			if (registries.length > 0 && !registries.includes(registry.name))
				return ok({ skipped: true, name: registry.name });

			const buildResult = await buildRegistry(registry, { options, config });
			if (buildResult.isErr()) return err(buildResult.error);
			return ok({ skipped: false, buildResult: buildResult.value });
		},
		{ cwd: options.cwd }
	);

	const buildEnd = performance.now();

	spinner.stop(
		`Built ${pc.green(buildResults.length)} ${buildResults.length > 1 ? 'registries' : 'registry'} in ${pc.green(
			`${(buildEnd - buildStart).toFixed(2)}ms`
		)}`
	);

	const preparedRegistries: BuildResult[] = [];
	const skippedRegistries: { skipped: true; name: string }[] = [];
	for (const buildResult of buildResults) {
		if (buildResult.isErr()) return err(buildResult.error);

		if (buildResult.value.skipped) {
			skippedRegistries.push({ skipped: true, name: buildResult.value.name });
			continue;
		}

		const result = validateRegistryPrepublish(buildResult.value.buildResult, {
			pkg: pkg.package,
		});
		if (result.isErr()) return err(result.error);
		preparedRegistries.push({
			...buildResult.value.buildResult,
			version: result.value.version,
		});
	}

	spinner.start(
		`Publishing ${pc.green(preparedRegistries.length)} ${preparedRegistries.length > 1 ? 'registries' : 'registry'}...`
	);

	const publishedRegistries: {
		skipped: false;
		name: string;
		version: string;
		result: Result<{ version: string; tag?: string }, CLIError>;
	}[] = [];
	for (const registry of preparedRegistries) {
		const publishResult = await publishRegistry(registry, {
			token,
			provider: jsrepoProvider,
			options,
		});
		publishedRegistries.push({
			skipped: false,
			name: registry.name,
			// we just validated this above
			version: registry.version!,
			result: publishResult,
		});
	}

	spinner.stop(
		`Published ${pc.green(publishedRegistries.length)} ${publishedRegistries.length > 1 ? 'registries' : 'registry'}`
	);

	const publishEnd = performance.now();

	return ok({
		duration: publishEnd - publishStart,
		dryRun: options.dryRun,
		publishedRegistries: [...skippedRegistries, ...publishedRegistries],
	});
}

function validateRegistryPrepublish(
	buildResult: BuildResult,
	{ pkg }: { pkg: Partial<PackageJson> }
): Result<{ name: string; version: string }, CLIError> {
	const [scope, registryName, ...rest] = buildResult.name.split('/');

	if (rest.length > 0) {
		return err(new InvalidRegistryNameError(buildResult.name));
	}

	if (!scope || !scope.startsWith('@')) {
		return err(new InvalidRegistryNameError(buildResult.name));
	}

	if (!scope.slice(1).match(NAME_REGEX)) {
		return err(new InvalidRegistryNameError(buildResult.name));
	}

	if (!registryName || !registryName.match(NAME_REGEX)) {
		return err(new InvalidRegistryNameError(buildResult.name));
	}

	if (buildResult.version === undefined) {
		return err(new InvalidRegistryVersionError(buildResult.version, buildResult.name));
	}

	let version: string | undefined;
	if (buildResult.version === 'package' && pkg.version !== undefined) {
		version = pkg.version;
	} else {
		version = buildResult.version;
	}

	if (version === undefined) {
		return err(new InvalidRegistryVersionError(version, buildResult.name));
	}

	const valid = semver.valid(version);

	if (!valid) {
		return err(new InvalidRegistryVersionError(version, buildResult.name));
	}

	return ok({ name: buildResult.name, version });
}

async function publishRegistry(
	registry: BuildResult,
	{
		token,
		provider,
		options,
	}: { token: string; provider: JsrepoProvider; options: PublishOptions }
): Promise<Result<{ version: string; tag?: string }, CLIError>> {
	const files = collectRegistryFiles(registry, options.cwd);

	const pack = tar.pack();
	for (const file of files) {
		pack.entry({ name: file.name }, file.content);
	}
	pack.finalize();

	const tarBuffer = await buffer(pack.pipe(createGzip()));

	try {
		const response = await fetch(`${provider.baseUrl}/api/publish/v3`, {
			body: tarBuffer,
			headers: {
				'content-type': 'application/gzip',
				'content-encoding': 'gzip',
				'x-api-key': token,
				'x-dry-run': options.dryRun ? '1' : '0',
				'x-access': registry.access ?? 'public',
			},
			method: 'POST',
		});

		if (!response.ok) {
			const error = (await response.json()) as { message?: string };
			return err(
				new JsrepoError(
					`Failed to publish ${pc.bold(registry.name)}: ${response.status} ${
						response.statusText
					} ${error.message}`,
					{
						suggestion: 'Please try again.',
					}
				)
			);
		}

		const data = await response.json();
		return ok({ version: data.version, tag: data.tag });
	} catch (e) {
		return err(
			new JsrepoError(
				`Failed to publish registry: ${e instanceof Error ? e.message : String(e)}`,
				{
					suggestion: 'Please try again.',
				}
			)
		);
	}
}

function collectRegistryFiles(buildResult: BuildResult, cwd: string) {
	const files: { name: string; content: string }[] = [];
	const readmePath = path.join(cwd, 'README.md');
	if (fs.existsSync(readmePath)) {
		files.push({ name: 'README.md', content: fs.readFileSync(readmePath, 'utf-8') });
	}

	const manifest: DistributedOutputManifest = {
		name: buildResult.name,
		authors: buildResult.authors,
		bugs: buildResult.bugs,
		description: buildResult.description,
		homepage: buildResult.homepage,
		repository: buildResult.repository,
		tags: buildResult.tags,
		version: buildResult.version,
		meta: buildResult.meta,
		type: 'distributed',
		plugins: buildResult.plugins,
		defaultPaths: buildResult.defaultPaths,
		items: buildResult.items.map((item) => ({
			name: item.name,
			description: item.description,
			type: item.type,
			add: item.add,
			registryDependencies: item.registryDependencies,
			dependencies: item.dependencies,
			devDependencies: item.devDependencies,
			envVars: item.envVars,
			files: item.files.map((file) => ({
				type: file.type,
				path: path.relative(path.join(cwd, item.basePath), path.join(cwd, file.path)),
				target: file.target,
			})),
		})),
	};
	files.push({
		name: MANIFEST_FILE,
		content: JSON.stringify(manifest),
	});

	for (const item of buildResult.items) {
		const outputItem: DistributedOutputItem = {
			name: item.name,
			description: item.description,
			type: item.type,
			add: item.add,
			files: item.files.map((file) => ({
				type: file.type,
				content: file.content,
				path: path.relative(path.join(cwd, item.basePath), path.join(cwd, file.path)),
				_imports_: file._imports_,
				target: file.target,
			})),
			registryDependencies: item.registryDependencies,
			dependencies: item.dependencies,
			devDependencies: item.devDependencies,
			envVars: item.envVars,
		};
		files.push({
			name: `${item.name}.json`,
			content: JSON.stringify(outputItem),
		});
	}

	return files;
}

function formatResult(result: PublishCommandResult): string {
	return `Completed in ${pc.green(`${result.duration.toFixed(2)}ms`)}
${result.publishedRegistries.map((registry) => `   ${formatRegistryResult(registry)}`).join('\n')}`;
}

function formatRegistryResult(
	registry: PublishCommandResult['publishedRegistries'][number]
): string {
	if (registry.skipped) {
		return pc.dim(`${pc.dim(registry.name)} >> Skipped`);
	}

	if (registry.result.isErr()) {
		return `${pc.cyan(registry.name)} ${pc.dim('→')} ${pc.red(registry.result.error.toString())}`;
	}

	const { version, tag } = registry.result.value;

	return `${pc.cyan(registry.name)} → ${pc.green(version)} ${pc.dim(tag ?? '')}`;
}
