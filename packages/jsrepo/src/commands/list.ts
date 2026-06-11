import { Command, Option } from 'commander';
import { err, ok, type Result } from 'nevereverthrow';
import path from 'pathe';
import pc from 'picocolors';
import { z } from 'zod';
import {
	commonOptions,
	defaultCommandOptionsSchema,
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import type { Manifest } from '@/outputs';
import { DEFAULT_PROVIDERS } from '@/providers';
import { type ResolvedRegistry, resolveRegistries } from '@/utils/add';
import type { RemoteDependency } from '@/utils/build';
import type { Config } from '@/utils/config';
import { loadConfigSearch } from '@/utils/config/utils';
import { type CLIError, InvalidRegistryError, RegistryNotProvidedError } from '@/utils/errors';
import { runAfterHooks, runBeforeHooks } from '@/utils/hooks';
import { stringify } from '@/utils/json';
import type { AbsolutePath } from '@/utils/types';

export const detailLevels = ['basic', 'full'] as const;
export type DetailLevel = (typeof detailLevels)[number];

export const schema = defaultCommandOptionsSchema.extend({
	verbose: z.boolean(),
	all: z.boolean(),
	json: z.boolean(),
	detail: z.enum(detailLevels).default('basic'),
});

export type ListOptions = z.infer<typeof schema>;

export const list = new Command('list')
	.description('List items available in registries.')
	.argument('[registries...]', 'Registry URLs to list items from.')
	.option('--all', 'Include when-needed and index items.', false)
	.option('--json', 'Output as JSON.', false)
	.addOption(
		new Option(
			'--detail <level>',
			`Amount of detail to show (${detailLevels.join(', ')}).`
		)
			.choices([...detailLevels])
			.default('basic')
	)
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.verbose)
	.action(async (registriesArg, rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: false,
		});

		const config = configResult?.config ?? ({} as Config);
		const cwd = configResult
			? (path.dirname(configResult.path) as AbsolutePath)
			: options.cwd;

		await runBeforeHooks(
			config,
			{ command: 'list', options: { ...options, cwd } },
			{ cwd, yes: true }
		);

		const result = await tryCommand(runList(registriesArg, { ...options, cwd }, configResult?.config));

		process.stdout.write(`${options.json ? formatJsonResult(result) : formatResult(result)}\n`);

		await runAfterHooks(
			config,
			{ command: 'list', options: { ...options, cwd }, result },
			{ cwd }
		);
	});

export type ListItem = {
	registry: ResolvedRegistry;
	item: Manifest['items'][number];
};

export type ListCommandResult = {
	registries: ResolvedRegistry[];
	items: ListItem[];
	detail: DetailLevel;
};

export async function runList(
	registriesArg: string[],
	options: ListOptions,
	config: Config | undefined
): Promise<Result<ListCommandResult, CLIError>> {
	const providers = config?.providers ?? DEFAULT_PROVIDERS;
	const registries = registriesArg.length > 0 ? registriesArg : (config?.registries ?? []);

	if (registries.length === 0) return err(new RegistryNotProvidedError());

	for (const registry of registries) {
		const foundProvider = providers.some((p) => p.matches(registry));
		if (!foundProvider) return err(new InvalidRegistryError(registry));
	}

	const resolvedRegistriesResult = await resolveRegistries(registries, {
		cwd: options.cwd,
		providers,
	});

	if (resolvedRegistriesResult.isErr()) {
		return err(resolvedRegistriesResult.error);
	}

	const resolvedRegistries = resolvedRegistriesResult.value;
	const items = Array.from(resolvedRegistries.entries()).flatMap(([_, registry]) =>
		registry.manifest.items
			.filter((item) => shouldIncludeItem(item, options.all))
			.map((item) => ({ registry, item }))
	);

	return ok({
		registries: Array.from(resolvedRegistries.values()),
		items,
		detail: options.detail,
	});
}

function shouldIncludeItem(
	item: Manifest['items'][number],
	all: boolean
): boolean {
	if (all) return true;
	if (item.name === 'index') return false;
	return (item.add ?? 'when-added') === 'when-added';
}

export function formatResult({ registries, items, detail }: ListCommandResult): string {
	if (items.length === 0) {
		return pc.dim('No items found.');
	}

	const lines: string[] = [];

	for (const registry of registries) {
		const registryItems = items.filter((entry) => entry.registry.url === registry.url);
		if (registryItems.length === 0) continue;

		lines.push(pc.cyan(registry.url));
		for (const entry of registryItems) {
			lines.push(formatItem(entry.item, { detail, indent: '  ' }));
		}
		lines.push('');
	}

	return lines.join('\n').trimEnd();
}

export function formatJsonResult({ registries, items, detail }: ListCommandResult): string {
	const serializedRegistries = registries
		.map((registry) => ({
			url: registry.url,
			items: items
				.filter((entry) => entry.registry.url === registry.url)
				.map(({ item }) => serializeItem(item, detail)),
		}))
		.filter((registry) => registry.items.length > 0);

	return stringify({ registries: serializedRegistries });
}

function serializeItem(item: Manifest['items'][number], detail: DetailLevel) {
	if (detail === 'basic') {
		return {
			name: item.name,
			...(item.title !== undefined ? { title: item.title } : {}),
			...(item.description !== undefined ? { description: item.description } : {}),
		};
	}

	return item;
}

function formatItem(
	item: Manifest['items'][number],
	{ detail, indent }: { detail: DetailLevel; indent: string }
): string {
	const lines: string[] = [];
	const identifier = formatIdentifier(item);
	lines.push(`${indent}${identifier}`);

	if (item.description) {
		lines.push(`${indent}  ${pc.dim(item.description)}`);
	}

	if (detail === 'full') {
		lines.push(...formatItemDetails(item, indent));
	}

	return lines.join('\n');
}

function formatIdentifier(item: Manifest['items'][number]): string {
	if (item.title && item.title !== item.name) {
		return `${pc.bold(item.name)} ${pc.dim(`— ${item.title}`)}`;
	}

	if (item.title) {
		return `${pc.bold(item.title)} ${pc.dim(`(${item.name})`)}`;
	}

	return pc.bold(item.name);
}

function formatItemDetails(item: Manifest['items'][number], indent: string): string[] {
	const detailIndent = `${indent}  `;
	const lines: string[] = [];

	lines.push(`${detailIndent}${pc.dim('type:')} ${item.type}`);

	if (item.add) {
		lines.push(`${detailIndent}${pc.dim('add:')} ${item.add}`);
	}

	if (item.categories?.length) {
		lines.push(`${detailIndent}${pc.dim('categories:')} ${item.categories.join(', ')}`);
	}

	if (item.registryDependencies?.length) {
		lines.push(
			`${detailIndent}${pc.dim('registry dependencies:')} ${item.registryDependencies.join(', ')}`
		);
	}

	const dependencies = formatDependencies(item.dependencies);
	if (dependencies) {
		lines.push(`${detailIndent}${pc.dim('dependencies:')} ${dependencies}`);
	}

	const devDependencies = formatDependencies(item.devDependencies);
	if (devDependencies) {
		lines.push(`${detailIndent}${pc.dim('dev dependencies:')} ${devDependencies}`);
	}

	if (item.envVars && Object.keys(item.envVars).length > 0) {
		lines.push(
			`${detailIndent}${pc.dim('env vars:')} ${Object.keys(item.envVars).join(', ')}`
		);
	}

	if (item.meta && Object.keys(item.meta).length > 0) {
		const meta = Object.entries(item.meta)
			.map(([key, value]) => `${key}=${value}`)
			.join(', ');
		lines.push(`${detailIndent}${pc.dim('meta:')} ${meta}`);
	}

	if (item.files?.length) {
		lines.push(`${detailIndent}${pc.dim('files:')}`);
		for (const file of item.files) {
			const parts: string[] = [String(file.path)];
			if (file.role && file.role !== 'file') parts.push(`[${file.role}]`);
			if (file.target) parts.push(`→ ${file.target}`);
			if ('relativePath' in file && file.relativePath) {
				parts.push(`(${String(file.relativePath)})`);
			}
			lines.push(`${detailIndent}  ${parts.join(' ')}`);
		}
	}

	return lines;
}

function formatDependencies(
	dependencies: (RemoteDependency | string)[] | undefined
): string | undefined {
	if (!dependencies?.length) return undefined;

	return dependencies
		.map((dep) => {
			if (typeof dep === 'string') return dep;
			return `${dep.name}${dep.version ? `@${dep.version}` : ''}`;
		})
		.join(', ');
}
