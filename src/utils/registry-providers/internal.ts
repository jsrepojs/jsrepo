import color from 'chalk';
import type { Block, Manifest } from '../../types';
import { Err, Ok, type Result } from '../blocks/ts/result';
import * as u from '../blocks/ts/url';
import { iFetch } from '../fetch';
import * as persisted from '../persisted';
import { TokenManager } from '../token-manager';
import {
	azure,
	bitbucket,
	fetchManifest,
	fetchRaw,
	github,
	gitlab,
	http,
	jsrepo,
	providers,
	selectProvider,
} from '.';
import type { RegistryProvider, RegistryProviderState } from './types';

export type RemoteBlock = Block & { sourceRepo: RegistryProviderState };

/** Wraps the basic implementation to inject our internal fetch method and the correct token. */
export async function internalFetchRaw(
	state: RegistryProviderState,
	resourcePath: string,
	{ verbose }: { verbose?: (msg: string) => void } = {}
) {
	return await fetchRaw(state, resourcePath, {
		verbose,
		// @ts-expect-error it's fine
		fetch: iFetch,
		token: getProviderToken(state.provider, state.url),
	});
}

/** Wraps the basic implementation to inject internal fetch method and the correct token. */
export async function internalFetchManifest(
	state: RegistryProviderState,
	{ verbose, noCache }: { verbose?: (msg: string) => void; noCache?: boolean } = {}
) {
	return await fetchManifest(state, {
		verbose,
		// @ts-expect-error it's fine
		fetch: (input, init) => iFetch(input, { ...init, cache: noCache ? 'reload' : undefined }),
		token: getProviderToken(state.provider, state.url),
	});
}

/** Gets the locally stored token for the given provider */
export function getProviderToken(provider: RegistryProvider, url: string): string | undefined {
	const storage = new TokenManager();

	// there isn't an auth implementation for http
	if (provider.name === 'http') {
		return storage.get(`http-${new URL(url).origin}`);
	}

	return storage.get(provider.name);
}

/** Parses the provided url and returns the state.
 *
 * @param repo
 * @returns
 */
export async function getProviderState(
	repo: string,
	{ noCache = false }: { noCache?: boolean } = {}
): Promise<Result<RegistryProviderState, string>> {
	const provider = selectProvider(repo);

	if (provider) {
		const storage = persisted.get();

		// only git providers are cached
		if (provider.name !== http.name) {
			if (noCache) {
				// remove the outdated cache if it exists
				storage.delete(`${repo}-state`);
			} else {
				const cached = storage.get(`${repo}-state`);

				if (cached) return Ok({ ...(cached as RegistryProviderState), provider });
			}
		}

		const parsed = provider.parse(repo, { fullyQualified: false });

		const state = await provider.state(repo, {
			token: getProviderToken(provider, parsed.url),
			// @ts-expect-error but it does work
			fetch: iFetch,
		});

		// only cache git providers
		if (provider.name !== http.name && !noCache) {
			storage.set(`${repo}-state`, state);
		}

		return Ok(state);
	}

	return Err(
		`Only ${providers.map((p, i) => `${i === providers.length - 1 ? 'and ' : ''}${color.bold(p.name)}`).join(', ')} registries are supported at this time!`
	);
}

/** Gets the provider state for each provided repo url
 *
 * @param repos
 * @returns
 */
export async function forEachPathGetProviderState(
	repos: string[],
	{ noCache = false }: { noCache?: boolean } = {}
): Promise<Result<RegistryProviderState[], { message: string; repo: string }>> {
	const resolvedPaths: RegistryProviderState[] = [];

	const errors = await Promise.all(
		repos.map(async (repo) => {
			const getProviderResult = await getProviderState(repo, { noCache });

			if (getProviderResult.isErr())
				return Err({ message: getProviderResult.unwrapErr(), repo });

			const providerState = getProviderResult.unwrap();

			resolvedPaths.push(providerState);
		})
	);

	const err = errors.find((err) => err !== undefined);

	if (err) return err;

	return Ok(resolvedPaths);
}

/** Fetches blocks for each registry and stores them in a map by their repo as well as category and block name.
 *
 * Example Key:
 * `github/ieedan/std/utils/math`
 *
 * @param repos
 * @returns
 */
export async function fetchBlocks(
	repos: RegistryProviderState[],
	{ verbose, noCache }: { verbose?: (msg: string) => void; noCache?: boolean } = {}
): Promise<Result<Map<string, RemoteBlock>, { message: string; repo: string }>> {
	const blocksMap = new Map<string, RemoteBlock>();

	const errors = await Promise.all(
		repos.map(async (state) => {
			const getManifestResult = await internalFetchManifest(state, { verbose, noCache });

			if (getManifestResult.isErr()) {
				return Err({ message: getManifestResult.unwrapErr(), repo: state.url });
			}

			const manifest = getManifestResult.unwrap();

			for (const category of manifest.categories) {
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
}

/** Maps the result of fetchManifests into a map of remote blocks
 *
 * @param manifests
 */
export function getRemoteBlocks(manifests: FetchManifestResult[]) {
	const blocksMap = new Map<string, RemoteBlock>();

	for (const manifest of manifests) {
		for (const category of manifest.manifest.categories) {
			for (const block of category.blocks) {
				blocksMap.set(u.join(manifest.state.url, `${block.category}/${block.name}`), {
					...block,
					sourceRepo: manifest.state,
				});
			}
		}
	}

	return blocksMap;
}

export type FetchManifestResult = {
	state: RegistryProviderState;
	manifest: Manifest;
};

/** Fetches the manifests for each provider
 *
 * @param repos
 * @returns
 */
export async function fetchManifests(
	repos: RegistryProviderState[],
	{ verbose, noCache }: { verbose?: (msg: string) => void; noCache?: boolean } = {}
): Promise<Result<FetchManifestResult[], { message: string; repo: string }>> {
	const manifests: FetchManifestResult[] = [];

	const errors = await Promise.all(
		repos.map(async (state) => {
			const getManifestResult = await internalFetchManifest(state, { verbose, noCache });

			if (getManifestResult.isErr()) {
				return Err({ message: getManifestResult.unwrapErr(), repo: state.url });
			}

			const manifest = getManifestResult.unwrap();

			manifests.push({ state, manifest });
		})
	);

	const err = errors.find((err) => err !== undefined);

	if (err) return err;

	return Ok(manifests);
}

export * from './types';

export {
	azure,
	bitbucket,
	github,
	gitlab,
	http,
	jsrepo,
	providers,
	internalFetchManifest as fetchManifest,
	internalFetchRaw as fetchRaw,
	selectProvider,
};
