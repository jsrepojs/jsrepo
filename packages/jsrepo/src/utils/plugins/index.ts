import type { JsrepoPlugin } from '@/utils/plugins/types';

export type {
	JsrepoPlugin,
	JsrepoPluginBuild,
	JsrepoPluginFactory,
	PluginInput,
	ResolvedPluginContributions,
} from '@/utils/plugins/types';
export {
	resolveBuildTransformEntries,
	resolveLanguageEntries,
	resolvePluginContributions,
	resolvePluginContributionsList,
	resolveProviderEntries,
	resolveTransformEntries,
} from '@/utils/plugins/normalize';
/**
 * Creates a jsrepo plugin object. Use this when authoring plugin packages.
 */
export function definePlugin(plugin: JsrepoPlugin): JsrepoPlugin {
	return plugin;
}
