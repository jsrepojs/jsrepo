// import { redis, REGISTRY_CACHE_PREFIX } from '$lib/ts/redis-client';
import { setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { schema } from './schema';
import { fail, redirect } from '@sveltejs/kit';
import { selectProvider } from 'jsrepo';
import { checkCache, updateCache } from '$lib/ts/registry/cache';
import { getRegistryData } from '$lib/ts/registry';

export const load = async () => {
	// const searchedRegistries = await redis.keys(`${REGISTRY_CACHE_PREFIX}:*`);

	const form = await superValidate(valibot(schema));

	return {
		form
		// searchedRegistries
	};
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event, valibot(schema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const provider = selectProvider(form.data.search);

		if (!provider) {
			return setError(form, 'search', 'Invalid registry url');
		}

		const registryUrl = form.data.search;

		const cache = await checkCache(registryUrl);

		if (cache) {
			throw redirect(303, `/registry?url=${registryUrl}`);
		}

		const pageData = await getRegistryData(provider, registryUrl);

		if (!pageData) {
			return setError(form, 'search', 'Invalid registry url');
		}

		updateCache(registryUrl, pageData);

		throw redirect(303, `/registry?url=${registryUrl}`);
	}
};
