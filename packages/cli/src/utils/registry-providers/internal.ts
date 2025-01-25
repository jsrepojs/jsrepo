import color from 'chalk';
import { fetchManifest, providers, selectProvider } from '.';
import { Err, Ok, type Result } from '../blocks/types/result';
import * as u from '../blocks/utils/url';
import type { Block } from '../build';
import * as persisted from '../persisted';
import type { RegistryProvider, RegistryProviderState } from './types';

export type RemoteBlock = Block & { sourceRepo: RegistryProviderState };

export const getProviderToken = (provider: RegistryProvider): string | undefined => {
	// there isn't an auth implementation for http
	if (provider.name === 'http') return;

	const token = persisted.get().get(`${provider.name}-token`);

	if (!token) return;

	return token as string;
};

// RENAME THIS TO getProviderState
export const getProviderInfo = async (
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

// RENAME TO SOMETHING ABOUT STATE YOU'LL THINK OF IT
/** Gets the provider state for each provided repo url
 *
 * @param repos
 * @returns
 */
export const resolvePaths = async (
	...repos: string[]
): Promise<Result<RegistryProviderState[], { message: string; repo: string }>> => {
	const resolvedPaths: RegistryProviderState[] = [];

	const errors = await Promise.all(
		repos.map(async (repo) => {
			const getProviderResult = await getProviderInfo(repo);

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
			const getManifestResult = await fetchManifest(state, {
				token: getProviderToken(state.provider)
			});

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
