import { GITHUB_TOKEN } from '$env/static/private';
import { markdownIt } from '$lib/ts/markdown.js';
import { redirect } from '@sveltejs/kit';
import { fetchManifest, fetchRaw, github, selectProvider, type RegistryProvider } from 'jsrepo';

export const load = async ({ url }) => {
	const registryUrl = url.searchParams.get('url');

	if (registryUrl == null) throw redirect(303, '/registries');

	const provider = selectProvider(registryUrl);

	if (!provider) throw redirect(303, '/registries');

	const providerState = await provider.state(registryUrl, { token: getProviderToken(provider) });

	const [manifestResult, readmeResult] = await Promise.all([
		fetchManifest(providerState, { token: getProviderToken(provider) }),
		fetchRaw(providerState, 'README.md', { token: getProviderToken(provider) })
	]);

	const manifest = manifestResult.match(
		(val) => val,
		() => {
			throw redirect(303, '/registries');
		}
	);

	let readme = readmeResult.match(
		(val) => val,
		() => undefined
	);

	if (readme != undefined) {
		const md = await markdownIt();

		readme = md.render(readme);
	}

	return {
		manifest,
		registryUrl,
		readme
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
