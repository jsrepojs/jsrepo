import { error, redirect } from '@sveltejs/kit';
import { selectProvider } from 'jsrepo';
import { getRegistryData } from '$lib/ts/registry/index.js';
import { checkCache, updateCache } from '$lib/ts/registry/cache';
import { redis, VIEW_PREFIX } from '$lib/ts/redis-client.js';
import { action } from '$lib/ts/server-actions/search-registries/server.js';

export const load = async ({ url, cookies }) => {
	const registryUrl = url.searchParams.get('url');
	const noCache = cookies.get('no-cache') === 'true';

	if (registryUrl == null) throw redirect(303, '/registries');

	const provider = selectProvider(registryUrl);

	if (!provider) throw redirect(303, '/registries');

	if (!noCache) {
		const cache = await checkCache(registryUrl);

		if (cache) {
			await redis.incr(`${VIEW_PREFIX}:${registryUrl}`);

			return {
				...cache,
				cacheAge: Date.now() - cache.timestamp,
				registryUrl
			};
		}
	}

	if (noCache) {
		cookies.delete('no-cache', {
			path: '/',
			httpOnly: false,
			secure: true,
			maxAge: 1 * 24 * 60 * 60
		});
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

export const actions = {
	default: action
};
