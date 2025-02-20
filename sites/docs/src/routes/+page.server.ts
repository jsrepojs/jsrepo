import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { schema } from '$lib/ts/server-actions/search-registries/client';
import { redis, VIEW_SET_NAME } from '$lib/ts/redis-client';
import { action } from '$lib/ts/server-actions/search-registries/server';

export const load = async () => {
	const ranked = redis.zrange(VIEW_SET_NAME, 0, -1, {
		rev: true,
		count: 5,
		offset: 0
	});

	const form = await superValidate(valibot(schema));

	return {
		form,
		popular: ranked
	};
};

export const actions = {
	default: action
};
