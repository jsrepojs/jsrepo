import { GITHUB_TOKEN } from '$env/static/private';
import { markdownIt } from '$lib/ts/markdown.js';
import { redirect } from '@sveltejs/kit';
import {
	fetchManifest,
	github,
	selectProvider,
	type RegistryProvider,
	type RegistryProviderState
} from 'jsrepo';

export const load = async ({ url }) => {
	const registryUrl = url.searchParams.get('url');

	if (registryUrl == null) throw redirect(303, '/registries');

	const provider = selectProvider(registryUrl);

	if (!provider) throw redirect(303, '/registries');

	const providerState = await provider.state(registryUrl, { token: getProviderToken(provider) });

	const [manifestResult, readmeResult] = await Promise.all([
		fetchManifest(providerState, { token: getProviderToken(provider) }),
		fetchReadme(providerState)
	]);

	const manifest = manifestResult.match(
		(val) => val,
		() => {
			throw redirect(303, '/registries');
		}
	);

	let readme: string | undefined = readmeResult;

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

const fetchReadme = async (state: RegistryProviderState): Promise<string | undefined> => {
	const url = await state.provider.resolveRaw(state, 'README.md');

	try {
		const headers = new Headers();

		const token = getProviderToken(state.provider);

		if (token !== undefined && state.provider.authHeader) {
			const [key, value] = state.provider.authHeader(token);

			headers.append(key, value);
		}

		const response = await fetch(url, { headers });

		if (!response.ok) {
			return undefined;
		}

		// this is because instead of returning 404 in some cases a webpage will be returned
		if (!response.headers.get('Content-Type')?.startsWith('text/plain')) {
			return undefined;
		}

		return await response.text();
	} catch {
		return undefined;
	}
};

const getProviderToken = (provider: RegistryProvider): string | undefined => {
	switch (provider.name) {
		case github.name:
			return GITHUB_TOKEN;
		// add the rest of the tokens here
	}

	return undefined;
};
