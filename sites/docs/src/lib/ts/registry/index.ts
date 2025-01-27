import {
	fetchManifest,
	github,
	type Manifest,
	type RegistryProvider,
	type RegistryProviderState
} from 'jsrepo';
import { markdownIt } from '../markdown';
import DOMPurify from 'isomorphic-dompurify';
import { GITHUB_TOKEN } from '$env/static/private';

export type RegistryPageData = {
	registryUrl: string;
	manifest: Manifest;
	readme: string | undefined;
};

export type RegistryInfo = Omit<RegistryPageData, 'registryUrl'>;

export const getRegistryData = async (
	provider: RegistryProvider,
	registryUrl: string
): Promise<RegistryInfo | undefined> => {
	const providerState = await provider.state(registryUrl, { token: getProviderToken(provider) });

	const [manifestResult, readmeResult] = await Promise.all([
		fetchManifest(providerState, { token: getProviderToken(provider) }),
		fetchReadme(providerState)
	]);

	if (manifestResult.isErr()) return undefined;

	const manifest = manifestResult.unwrap();

	let readme: string | undefined = readmeResult;

	if (readme != undefined) {
		const md = await markdownIt();

		readme = DOMPurify.sanitize(md.render(readme));
	}

	return {
		manifest,
		readme
	};
};

/** Gets the readme for the registry (if it exists) */
export const fetchReadme = async (state: RegistryProviderState): Promise<string | undefined> => {
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
