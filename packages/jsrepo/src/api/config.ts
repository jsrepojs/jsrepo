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
	type RegistryMeta,
	type Transform,
	type TransformOptions,
} from '@/utils/config';
export { loadConfigSearch } from '@/utils/config/utils';
