import type { Language } from '@/langs/types';
import type { ProviderFactory } from '@/providers/types';
import type {
	BuildTransform,
	JsrepoPlugin,
	JsrepoPluginBuild,
	PluginInput,
	ResolvedPluginContributions,
} from '@/utils/plugins/types';
import type { RemoteDependencyResolver, Transform } from '@/utils/config/plugin-types';

const EMPTY_CONTRIBUTIONS: ResolvedPluginContributions = {
	transforms: [],
	providers: [],
	languages: [],
	build: {},
};

function isTransform(value: PluginInput): value is Transform {
	return (
		typeof value === 'object' &&
		value !== null &&
		'transform' in value &&
		typeof value.transform === 'function'
	);
}

function isProviderFactory(value: PluginInput): value is ProviderFactory {
	return (
		typeof value === 'object' &&
		value !== null &&
		'name' in value &&
		'matches' in value &&
		'create' in value &&
		typeof value.matches === 'function' &&
		typeof value.create === 'function'
	);
}

function isLanguage(value: PluginInput): value is Language {
	return (
		typeof value === 'object' &&
		value !== null &&
		'name' in value &&
		'canResolveDependencies' in value &&
		'resolveDependencies' in value &&
		'transformImports' in value
	);
}

function isRemoteDependencyResolver(value: PluginInput): value is RemoteDependencyResolver {
	return typeof value === 'function';
}

function isJsrepoPlugin(value: PluginInput): value is JsrepoPlugin {
	if (typeof value !== 'object' || value === null) return false;
	if (isTransform(value) || isProviderFactory(value) || isLanguage(value)) return false;

	return (
		'transforms' in value ||
		'providers' in value ||
		'languages' in value ||
		'build' in value
	);
}

function mergeBuild(
	target: JsrepoPluginBuild,
	source: JsrepoPluginBuild | undefined
): JsrepoPluginBuild {
	if (!source) return target;

	const merged: JsrepoPluginBuild = { ...target, ...source };

	if (source.transforms) {
		merged.transforms = [...(target.transforms ?? []), ...source.transforms];
	}

	return merged;
}

function appendContributions(
	target: ResolvedPluginContributions,
	source: ResolvedPluginContributions
): ResolvedPluginContributions {
	return {
		transforms: [...target.transforms, ...source.transforms],
		providers: [...target.providers, ...source.providers],
		languages: [...target.languages, ...source.languages],
		build: mergeBuild(target.build, source.build),
	};
}

export function resolvePluginContributions(plugin: PluginInput): ResolvedPluginContributions {
	if (isJsrepoPlugin(plugin)) {
		return {
			transforms: plugin.transforms ?? [],
			providers: plugin.providers ?? [],
			languages: plugin.languages ?? [],
			build: plugin.build ?? {},
		};
	}

	if (isTransform(plugin)) {
		return { ...EMPTY_CONTRIBUTIONS, transforms: [plugin] };
	}

	if (isProviderFactory(plugin)) {
		return { ...EMPTY_CONTRIBUTIONS, providers: [plugin] };
	}

	if (isLanguage(plugin)) {
		return { ...EMPTY_CONTRIBUTIONS, languages: [plugin] };
	}

	if (isRemoteDependencyResolver(plugin)) {
		return {
			...EMPTY_CONTRIBUTIONS,
			build: { remoteDependencyResolver: plugin },
		};
	}

	return EMPTY_CONTRIBUTIONS;
}

export function resolvePluginContributionsList(
	plugins: PluginInput[] | undefined
): ResolvedPluginContributions {
	if (!plugins?.length) return EMPTY_CONTRIBUTIONS;

	return plugins.reduce(
		(accumulated, plugin) => appendContributions(accumulated, resolvePluginContributions(plugin)),
		EMPTY_CONTRIBUTIONS
	);
}

export function resolveTransformEntries(
	entries: (Transform | JsrepoPlugin)[] | undefined
): Transform[] {
	if (!entries?.length) return [];

	return entries.flatMap((entry) => resolvePluginContributions(entry).transforms);
}

export function resolveProviderEntries(
	entries: (ProviderFactory | JsrepoPlugin)[] | undefined
): ProviderFactory[] {
	if (!entries?.length) return [];

	return entries.flatMap((entry) => resolvePluginContributions(entry).providers);
}

export function resolveLanguageEntries(entries: (Language | JsrepoPlugin)[] | undefined): Language[] {
	if (!entries?.length) return [];

	return entries.flatMap((entry) => resolvePluginContributions(entry).languages);
}

export function resolveBuildTransformEntries(
	entries: (BuildTransform | JsrepoPlugin)[] | undefined
): BuildTransform[] {
	if (!entries?.length) return [];

	return entries.flatMap((entry) => {
		if (typeof entry === 'object' && entry !== null && 'transform' in entry) {
			return [entry as BuildTransform];
		}
		return resolvePluginContributions(entry as PluginInput).build.transforms ?? [];
	});
}
