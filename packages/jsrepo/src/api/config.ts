export type { RemoteDependency } from '@/utils/build';
export {
	type Config,
	defineConfig,
	type RegistryConfig,
	RegistryFileRoles as OptionallyInstalledRegistryTypes,
	type RegistryItem,
	type RegistryItemAdd,
	type RegistryItemFile,
	type RegistryItemType,
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
