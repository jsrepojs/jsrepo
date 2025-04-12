import { getFeatured, getPopular } from '$lib/backend/db/functions';
import { schema } from '$lib/ts/server-actions/search-registries/client';
import { action } from '$lib/ts/server-actions/search-registries/server.js';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';

export async function load() {
	const form = await superValidate(valibot(schema));
	
	const [featured, popular] = await Promise.all([getFeatured(), getPopular()]);

	return {
		popular,
		featured,
		form
	};
}

export const actions = {
    default: action
}