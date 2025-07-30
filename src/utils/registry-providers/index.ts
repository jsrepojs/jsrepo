import { MANIFEST_FILE } from '../../constants';
import type { Manifest } from '../../types';
import { Err, Ok, type Result } from '../blocks/ts/result';
import { parseManifest } from '../manifest';
import { type AzureProviderState, azure } from './azure';
import { type BitBucketProviderState, bitbucket } from './bitbucket';
import { type GitHubProviderState, github } from './github';
import { type GitLabProviderState, gitlab } from './gitlab';
import { http } from './http';
import { type JsrepoProviderState, jsrepo } from './jsrepo';
import type { RegistryProvider, RegistryProviderState } from './types';

export const providers = [jsrepo, github, gitlab, bitbucket, azure, http];

export function selectProvider(url: string): RegistryProvider | undefined {
	const provider = providers.find((p) => p.matches(url));

	return provider;
}

export type FetchOptions = {
	token: string;
	/** Override the fetch method. */
	fetch?: typeof fetch;
	verbose: (str: string) => void;
};

export async function fetchRaw(
	state: RegistryProviderState,
	resourcePath: string,
	{ verbose, fetch: f = fetch, token }: Partial<FetchOptions> = {}
): Promise<Result<string, string>> {
	const url = await state.provider.resolveRaw(state, resourcePath);

	verbose?.(`Trying to fetch from ${url}`);

	try {
		// having headers as a record covers more fetch implementations
		const headers: Record<string, string> = {};

		if (token !== undefined && state.provider.authHeader) {
			const [key, value] = state.provider.authHeader(token);

			headers[key] = value;
		}

		if (state.provider.name === github.name) {
			headers.Accept = 'application/vnd.github.raw+json';
		}

		const response = await f(url.toString(), { headers });

		verbose?.(`Got a response from ${url} ${response.status} ${response.statusText}`);

		if (!response.ok) {
			return Err(
				state.provider.formatFetchError(
					state,
					resourcePath,
					`${response.status} ${response.statusText}`
				)
			);
		}

		return Ok(await response.text());
	} catch (err) {
		return Err(state.provider.formatFetchError(state, resourcePath, err));
	}
}

export async function fetchManifest(
	state: RegistryProviderState,
	{ fetch: f = fetch, ...rest }: Partial<FetchOptions> = {}
): Promise<Result<Manifest, string>> {
	const manifest = await fetchRaw(state, MANIFEST_FILE, { fetch: f, ...rest });

	if (manifest.isErr()) return Err(manifest.unwrapErr());

	return parseManifest(manifest.unwrap());
}

export * from './types';

export {
	jsrepo,
	github,
	gitlab,
	bitbucket,
	azure,
	http,
	type JsrepoProviderState,
	type AzureProviderState,
	type GitHubProviderState,
	type GitLabProviderState,
	type BitBucketProviderState,
};
