// import { redis, REGISTRY_CACHE_PREFIX } from '$lib/ts/redis-client';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { schema } from '$lib/ts/server-actions/search-registries/client';
import { redis, VIEW_PREFIX } from '$lib/ts/redis-client';
import { action } from '$lib/ts/server-actions/search-registries/server';

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

		sortedPairs = keyValuePairs.sort((a, b) => b.value - a.value).slice(0, 4);
	}

	const form = await superValidate(valibot(schema));

	return {
		form,
		popular: sortedPairs ? sortedPairs.map((p) => p.key.slice(`${VIEW_PREFIX}:`.length)) : []
	};
};

export const actions = {
	default: action
};
