import { DEFAULT_LANGS } from '@/langs';
import type { Language } from '@/langs/types';
import { DEFAULT_PROVIDERS } from '@/providers';
import type { ProviderFactory } from '@/providers/types';
import {
	resolveBuildTransformEntries,
	resolveLanguageEntries,
	resolvePluginContributionsList,
	resolveProviderEntries,
	resolveTransformEntries,
} from '@/utils/plugins/normalize';
import type {
	BuildTransform,
	JsrepoPluginHooks,
	PluginInput,
	RemoteDependencyResolver,
	Transform,
} from '@/utils/plugins/types';
import type { Warning } from '@/utils/warnings';

type BeforeHook = import('@/utils/hooks').BeforeHook;
type AfterHook = import('@/utils/hooks').AfterHook;

type ConfigHooks = {
	after?: AfterHook | AfterHook[];
	before?: BeforeHook | BeforeHook[];
};

function normalizeBeforeHooks(hook: BeforeHook | BeforeHook[] | undefined): BeforeHook[] {
	if (!hook) return [];
	return Array.isArray(hook) ? hook : [hook];
}

function normalizeAfterHooks(hook: AfterHook | AfterHook[] | undefined): AfterHook[] {
	if (!hook) return [];
	return Array.isArray(hook) ? hook : [hook];
}

function mergeConfigHooks(
	pluginHooks: JsrepoPluginHooks,
	configHooks: ConfigHooks | undefined
): ConfigHooks | undefined {
	const before = [
		...normalizeBeforeHooks(pluginHooks.before),
		...normalizeBeforeHooks(configHooks?.before),
	];
	const after = [
		...normalizeAfterHooks(pluginHooks.after),
		...normalizeAfterHooks(configHooks?.after),
	];

	if (before.length === 0 && after.length === 0) {
		return configHooks;
	}

	const merged: ConfigHooks = {};
	if (before.length > 0) {
		merged.before = before.length === 1 ? before[0]! : before;
	}
	if (after.length > 0) {
		merged.after = after.length === 1 ? after[0]! : after;
	}
	return merged;
}

export type ResolvedConfig = {
	registries: string[];
	registry: unknown;
	providers: ProviderFactory[];
	languages: Language[];
	transforms: Transform[];
	paths: Record<string, string | undefined>;
	build: {
		onwarn?: (warning: Warning, handler: (message: Warning) => void) => void;
		transforms?: BuildTransform[];
		remoteDependencyResolver?: RemoteDependencyResolver;
	};
	hooks?: ConfigHooks;
	onwarn?: (warning: Warning, handler: (message: Warning) => void) => void;
};

export type PartialConfig = Partial<
	Omit<ResolvedConfig, 'build'> & {
		build?: Partial<ResolvedConfig['build']>;
	}
> & {
	plugins?: PluginInput[];
};

export function resolveConfig(c: PartialConfig): ResolvedConfig {
	const pluginContributions = resolvePluginContributionsList(c.plugins);

	const transforms = [
		...pluginContributions.transforms,
		...resolveTransformEntries(c.transforms),
	];

	const providers = [
		...pluginContributions.providers,
		...resolveProviderEntries(c.providers),
	];

	const languages = [
		...pluginContributions.languages,
		...resolveLanguageEntries(c.languages),
	];

	const buildTransforms = [
		...(pluginContributions.build.transforms ?? []),
		...resolveBuildTransformEntries(c.build?.transforms),
	];

	const build: ResolvedConfig['build'] = {
		onwarn: c.build?.onwarn ?? c.onwarn ?? pluginContributions.build.onwarn,
		...c.build,
		...pluginContributions.build,
	};

	if (buildTransforms.length > 0) {
		build.transforms = buildTransforms;
	}

	return {
		providers:
			c.providers !== undefined || pluginContributions.providers.length > 0
				? providers
				: DEFAULT_PROVIDERS,
		registries: c.registries ?? [],
		registry: c.registry ?? [],
		languages:
			c.languages !== undefined || pluginContributions.languages.length > 0
				? languages
				: DEFAULT_LANGS,
		transforms,
		paths: c.paths ?? {},
		hooks: mergeConfigHooks(pluginContributions.hooks, c.hooks),
		build,
	};
}
