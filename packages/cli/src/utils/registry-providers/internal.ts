import color from 'chalk';
import nodeFetch from 'node-fetch';
import {
	http,
	azure,
	bitbucket,
	fetchManifest,
	fetchRaw,
	github,
	gitlab,
	providers,
	selectProvider,
} from '.';
import { Err, Ok, type Result } from '../blocks/types/result';
import * as u from '../blocks/utils/url';
import type { Block } from '../build';
import * as persisted from '../persisted';
import type { RegistryProvider, RegistryProviderState } from './types';

export type RemoteBlock = Block & { sourceRepo: RegistryProviderState };

/** Wraps the basic implementation to inject `node-fetch` and the correct token. */
export const internalFetchRaw = async (
	state: RegistryProviderState,
	resourcePath: string,
	{ verbose }: { verbose?: (msg: string) => void } = {}
) => {
	return await fetchRaw(state, resourcePath, {
		verbose,
		// @ts-expect-error but it does work
		fetch: nodeFetch,
		token: getProviderToken(state.provider),
	});
};

/** Wraps the basic implementation to inject `node-fetch` and the correct token. */
export const internalFetchManifest = async (
	state: RegistryProviderState,
	{ verbose }: { verbose?: (msg: string) => void } = {}
) => {
	return await fetchManifest(state, {
		verbose,
		// @ts-expect-error but it does work
		fetch: nodeFetch,
		token: getProviderToken(state.provider),
	});
};

/** Gets the locally stored token for the given provider */
export const getProviderToken = (provider: RegistryProvider): string | undefined => {
	// there isn't an auth implementation for http
	if (provider.name === 'http') return;

	const token = persisted.get().get(`${provider.name}-token`);

	if (!token) return;

	return token as string;
};

/** Parses the provided url and returns the state.
 * 
 * @param repo 
 * @returns 
 */
export const getProviderState = async (
	repo: string
): Promise<Result<RegistryProviderState, string>> => {
	const provider = selectProvider(repo);
	if (provider) {
		const state = await provider.state(repo, { token: getProviderToken(provider) });

		return Ok(state);
	}

	return Err(
		`Only ${providers.map((p, i) => `${i === providers.length - 1 ? 'and ' : ''}${color.bold(p.name)}`).join(', ')} registries are supported at this time!`
	);
};

/** Gets the provider state for each provided repo url
 *
 * @param repos
 * @returns
 */
export const forEachPathGetProviderState = async (
	...repos: string[]
): Promise<Result<RegistryProviderState[], { message: string; repo: string }>> => {
	const resolvedPaths: RegistryProviderState[] = [];

	const errors = await Promise.all(
		repos.map(async (repo) => {
			const getProviderResult = await getProviderState(repo);

			if (getProviderResult.isErr())
				return Err({ message: getProviderResult.unwrapErr(), repo });

			const providerState = getProviderResult.unwrap();

			resolvedPaths.push(providerState);
		})
	);

	const err = errors.find((err) => err !== undefined);

	if (err) return err;

	return Ok(resolvedPaths);
};

/** Fetches blocks for each registry and stores them in a map by their repo as well as category and block name.
 *
 * Example Key:
 * `github/ieedan/std/utils/math`
 *
 * @param repos
 * @returns
 */
export const fetchBlocks = async (
	...repos: RegistryProviderState[]
): Promise<Result<Map<string, RemoteBlock>, { message: string; repo: string }>> => {
	const blocksMap = new Map<string, RemoteBlock>();

	const errors = await Promise.all(
		repos.map(async (state) => {
			const getManifestResult = await internalFetchManifest(state);

			if (getManifestResult.isErr()) {
				return Err({ message: getManifestResult.unwrapErr(), repo: state.url });
			}

			const categories = getManifestResult.unwrap();

			for (const category of categories) {
				for (const block of category.blocks) {
					blocksMap.set(u.join(state.url, `${block.category}/${block.name}`), {
						...block,
						sourceRepo: state,
					});
				}
			}
		})
	);

	const err = errors.find((err) => err !== undefined);

	if (err) return err;

	return Ok(blocksMap);
};

export * from './types';

export {
	azure,
	bitbucket,
	github,
	gitlab,
	http,
	providers,
	internalFetchManifest as fetchManifest,
	internalFetchRaw as fetchRaw,
	selectProvider,
};
