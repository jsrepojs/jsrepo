import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { schema } from '$lib/ts/server-actions/search-registries/client';
import { action } from '$lib/ts/server-actions/search-registries/server';
import { db } from '$lib/db';
import { featuredRegistries, registries } from '$lib/db/schema.js';
import { desc } from 'drizzle-orm';

export const load = async () => {
	const mostPopular = db.select().from(registries).orderBy(desc(registries.views)).limit(5);
	const featured = db.select().from(featuredRegistries).orderBy(featuredRegistries.url).limit(5);

	const form = await superValidate(valibot(schema));

	return {
		form,
		featured,
		popular: mostPopular
	};
};

export const actions = {
	default: action
};
