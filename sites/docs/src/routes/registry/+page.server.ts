import { error, redirect } from '@sveltejs/kit';
import { selectProvider } from 'jsrepo';
import { getRegistryData, type RegistryPageData } from '$lib/ts/registry/index.js';
import { checkCache, updateCache } from '$lib/ts/registry/cache';
import { redis, VIEW_PREFIX } from '$lib/ts/redis-client.js';

export const load = async ({ url }) => {
	const registryUrl = url.searchParams.get('url');
	const noCache = url.searchParams.get('noCache') === 'true';

	if (registryUrl == null) throw redirect(303, '/registries');

	const provider = selectProvider(registryUrl);

	if (!provider) throw redirect(303, '/registries');

	if (!noCache) {
		const cache = await checkCache(registryUrl);

		if (cache) {
			return {
				...cache,
				registryUrl
			} satisfies RegistryPageData;
		}
	}

	const pageData = await getRegistryData(provider, registryUrl);

	if (!pageData) {
		throw error(404, { message: 'registry-search: Could not find the requested registry' });
	}

	await redis.incr(`${VIEW_PREFIX}:${registryUrl}`);

	updateCache(registryUrl, pageData);

	return {
		...pageData,
		registryUrl
	};
};
