export {
	fetchAllResolvedItems,
	getPathsForItems,
	normalizeItemTypeForPath,
	parseWantedItems,
	prepareUpdates,
	type RegistryItemWithContent,
	resolveAndFetchAllItems,
	resolveRegistries,
	resolveTree,
	resolveWantedItems,
	updateFiles,
} from '@/utils/add';
export { resolveWithRoles } from '@/utils/roles';
export { joinAbsolute } from '@/utils/path';
export {
	detectPackageManager,
	promptAddEnvVars,
	promptInstallDependenciesByEcosystem,
} from '@/utils/prompts';
export type { AbsolutePath, ItemRelativePath } from '@/utils/types';
