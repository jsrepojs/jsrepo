import type { AbsolutePath, ItemRelativePath, LooseAutocomplete } from '@/utils/types';
import type { MaybePromise } from '@/utils/types';
import type { Warning } from '@/utils/warnings';

export type RemoteDependency = {
	ecosystem: string;
	name: string;
	version?: string;
};

export type UnresolvedFile = {
	path: string;
};

export type RemoteDependencyResolverOptions = {
	cwd: AbsolutePath;
};

export type RemoteDependencyResolver = (
	dep: RemoteDependency,
	options: RemoteDependencyResolverOptions
) => MaybePromise<RemoteDependency>;

export type BuildTransform = {
	transform: (
		content: string,
		opts: { cwd: AbsolutePath; file: UnresolvedFile }
	) => MaybePromise<{ content: string }>;
};

export type TransformOptions = {
	cwd: AbsolutePath;
	registryUrl: string;
	item: {
		name: string;
		type: LooseAutocomplete<string>;
	};
};

export type Transform = {
	transform: (opts: {
		code: string;
		fileName: ItemRelativePath;
		options: TransformOptions;
	}) => Promise<{ code?: string; fileName?: ItemRelativePath }>;
};

export type ConfigBuild = {
	onwarn?: (warning: Warning, handler: (message: Warning) => void) => void;
	transforms?: BuildTransform[];
	remoteDependencyResolver?: RemoteDependencyResolver;
};
