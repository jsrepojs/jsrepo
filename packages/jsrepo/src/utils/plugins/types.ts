import type { Language } from '@/langs/types';
import type { ProviderFactory } from '@/providers/types';
import type {
	BuildTransform,
	RemoteDependencyResolver,
	Transform,
} from '@/utils/config/plugin-types';
import type { Warning } from '@/utils/warnings';

export type { BuildTransform, RemoteDependencyResolver, Transform } from '@/utils/config/plugin-types';

export type JsrepoPluginBuild = {
	transforms?: BuildTransform[];
	remoteDependencyResolver?: RemoteDependencyResolver;
	onwarn?: (warning: Warning, handler: (message: Warning) => void) => void;
};

export type JsrepoPlugin = {
	transforms?: Transform[];
	providers?: ProviderFactory[];
	languages?: Language[];
	build?: JsrepoPluginBuild;
};

export type JsrepoPluginFactory<TOptions = void> = TOptions extends void
	? () => JsrepoPlugin
	: (options: TOptions) => JsrepoPlugin;

export type ResolvedPluginContributions = {
	transforms: Transform[];
	providers: ProviderFactory[];
	languages: Language[];
	build: JsrepoPluginBuild;
};

export type PluginInput =
	| JsrepoPlugin
	| Transform
	| ProviderFactory
	| Language
	| RemoteDependencyResolver;
