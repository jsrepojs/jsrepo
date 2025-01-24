import * as registry from 'valibot';
import type { Manifest } from '../../registry';
import { Err, Ok, type Result } from '../blocks/types/result';
import { OUTPUT_FILE } from '../context';
import { github } from './github';
import { gitlab } from './gitlab';
import type { RegistryProvider, RegistryProviderState } from './types';
import { categorySchema } from '../build';

export const providers = [github, gitlab];

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

		if (token !== undefined) {
			const [key, value] = state.provider.authHeader(token);

			headers.append(key, value);
		}

		const response = await fetch(url, { headers });

		verbose?.(`Got a response from ${url} ${response.status} ${response.statusText}`);

		if (!response.ok) {
			return Err(state.provider.formatFetchError(state, resourcePath));
		}

		const content = await response.text();

		console.log(content);

		return Ok(content);
	} catch (err) {
		console.log(err);
		return Err(state.provider.formatFetchError(state, resourcePath));
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
