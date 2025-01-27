// import { redis, REGISTRY_CACHE_PREFIX } from '$lib/ts/redis-client';
import { setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { schema } from './schema';
import { fail, redirect } from '@sveltejs/kit';
import { selectProvider } from 'jsrepo';
import { checkCache, updateCache } from '$lib/ts/registry/cache';
import { getRegistryData } from '$lib/ts/registry';
import { redis, VIEW_PREFIX } from '$lib/ts/redis-client';

export const load = async () => {
	let cursor = '0';

	const keys: string[] = [];

	do {
		const [newCursor, matched] = await redis.scan(cursor, {
			match: `${VIEW_PREFIX}:*`,
			count: 100
		});

		keys.push(...matched);
		cursor = newCursor;
	} while (cursor !== '0');

	let sortedPairs:
		| {
				key: string;
				value: number;
		  }[]
		| undefined = undefined;

	if (keys.length > 0) {
		const values = await redis.mget(...keys);

		const keyValuePairs = keys
			.map((key, index) => ({ key, value: parseInt(values[index] as string, 10) }))
			.filter((pair) => !isNaN(pair.value)); // Ensure values are valid numbers

		sortedPairs = keyValuePairs.sort((a, b) => b.value - a.value).slice(0, 3);
	}

	const form = await superValidate(valibot(schema));

	return {
		form,
		popular: sortedPairs ? sortedPairs.map((p) => p.key.slice(`${VIEW_PREFIX}:`.length)) : []
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
