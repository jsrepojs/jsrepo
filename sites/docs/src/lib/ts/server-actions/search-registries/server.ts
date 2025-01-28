import { getRegistryData } from '$lib/ts/registry';
import { checkCache, updateCache } from '$lib/ts/registry/cache';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { selectProvider } from 'jsrepo';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { schema } from './client';

export const action = async (event: RequestEvent) => {
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

	// this prevents infinite loading state if you are already on the same page
	if (event.url.pathname === '/registry' && event.url.searchParams.get('url') === registryUrl) {
		return message(form, 'You are already there!');
	}

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
};
