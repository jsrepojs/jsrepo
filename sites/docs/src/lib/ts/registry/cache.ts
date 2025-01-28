import { categorySchema } from 'jsrepo';
import * as v from 'valibot';
import { redis, REGISTRY_CACHE_PREFIX } from '../redis-client';
import type { RegistryInfo } from '.';

export const cacheSchema = v.object({
	readme: v.optional(v.string()),
	manifest: v.array(categorySchema),
	timestamp: v.number()
});

const getCacheKey = (registryUrl: string) => `${REGISTRY_CACHE_PREFIX}:${registryUrl}`;

export const checkCache = async (
	registryUrl: string
): Promise<(RegistryInfo & { timestamp: number }) | undefined> => {
	const cacheKey = getCacheKey(registryUrl);

	const entry = await redis.get(cacheKey);
	if (entry !== null) {
		try {
			const cache = v.parse(cacheSchema, entry);

			return {
				manifest: cache.manifest,
				readme: cache.readme,
				timestamp: cache.timestamp
			};
		} catch {
			// if data was malformed just delete cache
			await redis.del(cacheKey);
		}
	}

	return undefined;
};

export const updateCache = async (registryUrl: string, info: RegistryInfo) => {
	const cacheKey = getCacheKey(registryUrl);

	const cache = {
		...info,
		timestamp: Date.now()
	};

	const ttl = 1000 * 60 * 60 * 24; // 24 hours

	await redis.set(cacheKey, JSON.stringify(cache), { pxat: Date.now() + ttl });
};
