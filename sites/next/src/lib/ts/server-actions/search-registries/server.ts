import { getProviderState } from '$lib/ts/registry';
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

	if (event.url.pathname === `/registries/${registryUrl}}`) {
		return message(form, 'You are already there!');
	}

	// just gets the state and sets the cache
	await getProviderState(registryUrl, provider, { cache: true });

	throw redirect(303, `/registries/${registryUrl}`);
};
