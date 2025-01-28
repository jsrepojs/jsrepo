import { schema } from '$lib/ts/server-actions/search-registries/client';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';

export const load = async () => {
	const form = await superValidate(valibot(schema));

	return {
		form
	};
};
