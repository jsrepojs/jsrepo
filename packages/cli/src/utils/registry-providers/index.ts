import * as registry from 'valibot';
import type { Manifest } from '../../registry';
import { Err, Ok, type Result } from '../blocks/types/result';
import { categorySchema } from '../build';
import { OUTPUT_FILE } from '../context';
import { azure } from './azure';
import { bitbucket } from './bitbucket';
import { github } from './github';
import { gitlab } from './gitlab';
import { http } from './http';
import type { RegistryProvider, RegistryProviderState } from './types';

export const providers = [github, gitlab, bitbucket, azure, http];

export const selectProvider = (url: string): RegistryProvider | undefined => {
	const provider = providers.find((p) => p.matches(url));

	return provider;
};

export type FetchOptions = {
	token: string;
	verbose: (str: string) => void;
};

export const fetchRaw = async (
	state: RegistryProviderState,
	resourcePath: string,
	{ verbose, token }: Partial<FetchOptions> = {}
): Promise<Result<string, string>> => {
	const url = await state.provider.resolveRaw(state, resourcePath);

	verbose?.(`Trying to fetch from ${url}`);

	try {
		const headers = new Headers();

		if (token !== undefined && state.provider.authHeader) {
			const [key, value] = state.provider.authHeader(token);

			headers.append(key, value);
		}

		const response = await fetch(url, { headers });

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
		console.log(err);
		return Err(state.provider.formatFetchError(state, resourcePath, err));
	}
};

export const fetchManifest = async (
	state: RegistryProviderState,
	opts: Partial<FetchOptions> = {}
): Promise<Result<Manifest, string>> => {
	const manifest = await fetchRaw(state, OUTPUT_FILE, opts);

	if (manifest.isErr()) return Err(manifest.unwrapErr());

	const categories = registry.safeParse(
		registry.array(categorySchema),
		JSON.parse(manifest.unwrap())
	);

	if (!categories.success) {
		return Err(`Error parsing categories: ${categories.issues}`);
	}

	return Ok(categories.output);
};

export { github, gitlab, bitbucket, azure, http };
