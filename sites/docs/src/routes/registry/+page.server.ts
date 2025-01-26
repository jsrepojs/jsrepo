import { GITHUB_TOKEN } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { fetchManifest, github, selectProvider, type RegistryProvider } from 'jsrepo';

export const load = async ({ url }) => {
	const registryUrl = url.searchParams.get('url');

	if (registryUrl == null) throw redirect(303, '/registries');

	const provider = selectProvider(registryUrl);

	if (!provider) throw redirect(303, '/registries');

	const providerState = await provider.state(registryUrl, { token: getProviderToken(provider) });

	const manifest = await (
		await fetchManifest(providerState, { token: getProviderToken(provider) })
	).match(
		(val) => val,
		() => {
			throw redirect(303, '/registries');
		}
	);

	return {
		manifest
	};
};

const getProviderToken = (provider: RegistryProvider): string | undefined => {
	switch (provider.name) {
		case github.name:
			return GITHUB_TOKEN;
        // add the rest of the tokens here
	}

	return undefined;
};
