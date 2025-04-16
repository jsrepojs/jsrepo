import { dev } from '$app/environment';
import { functions } from '$lib/backend/db';
import { getProviderState, getRegistryData } from '$lib/ts/registry';
import { action } from '$lib/ts/server-actions/search-registries/server';
import { error, redirect } from '@sveltejs/kit';
import { selectProvider } from 'jsrepo';

export async function load({ params }) {
	const registryUrl = params.registry;

	const provider = selectProvider(registryUrl);

	if (!provider) redirect(303, '/registries');

	const state = await getProviderState(registryUrl, provider, { cache: true });

	const pageData = await getRegistryData(state);

	if (!pageData) {
		error(404, { message: 'registry-search: Could not find the requested registry' });
	}

	if (!dev) {
		await functions.tryIncrementViews(registryUrl);
	}

	return {
		...pageData,
		registryUrl
	};
}

export const actions = {
	default: action
};
