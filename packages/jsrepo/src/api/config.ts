export type { RemoteDependency } from '@/utils/build';
export {
	type BuildTransform,
	type Config,
	type ConfigHooks,
	defineConfig,
	type Plugin,
	type PluginBuild,
	type RegistryConfig,
	RegistryFileRoles as OptionallyInstalledRegistryTypes,
	type RegistryItem,
	type RegistryItemAdd,
	type RegistryItemFile,
	type RegistryItemType,
	type RegistryPlugin,
	type RemoteDependencyResolver,
	type RemoteDependencyResolverOptions,
	type Transform,
	type TransformOptions,
} from '@/utils/config';
export { loadConfigSearch } from '@/utils/config/utils';
export type {
	AfterArgs,
	AfterHook,
	BeforeArgs,
	BeforeHook,
	Hook,
	HookFn,
	InferHookArgs,
} from '@/utils/hooks';
