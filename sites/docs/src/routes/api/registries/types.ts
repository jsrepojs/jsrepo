import type { RegistryInfo } from '$lib/ts/registry';

export type RegistryResponse = {
	registries:
		| (RegistryInfo & { url: string; provider: string })[]
		| { url: string; provider: string }[];
	hasMore: boolean;
	total: number;
};
