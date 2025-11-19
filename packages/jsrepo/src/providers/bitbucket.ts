import type { CreateOptions, FetchOptions, Provider, ProviderFactory } from '@/providers/types';
import { ProviderFetchError } from '@/utils/errors';

const BASE_URL = 'https://bitbucket.org';
const DEFAULT_BRANCH = 'main';

export type BitBucketOptions = {
	/** If you are self hosting Bitbucket and you want bitbucket/ to default to your base url instead of https://bitbucket.org */
	baseUrl?: string;
};

/**
 * The built in Bitbucket provider.
 * @param options
 * @returns
 *
 * @urlFormat
 * ```
 * 'https://bitbucket.org/<owner>/<repo>'
 * 'bitbucket/<owner>/<repo>'
 * 'bitbucket/<owner>/<repo>/src/<ref>'
 * ```
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo/config";
 * import { bitbucket } from "jsrepo/providers";
 *
 * export default defineConfig({
 * 	providers: [bitbucket()],
 * });
 * ```
 */
export function bitbucket(options: BitBucketOptions = {}): ProviderFactory {
	return {
		name: 'bitbucket',
		matches: (url: string) =>
			url.startsWith(BASE_URL) ||
			url.startsWith('bitbucket/') ||
			url.startsWith('bitbucket:'),
		create: (url: string, createOpts: CreateOptions) =>
			BitBucket.create(url, options, createOpts),
		auth: {
			tokenStoredFor: 'provider',
			envVar: 'BITBUCKET_TOKEN',
		},
	};
}

type BitBucketState = {
	baseUrl: string;
	owner: string;
	repoName: string;
	ref?: string;
};

class BitBucket implements Provider {
	constructor(
		readonly state: BitBucketState,
		readonly opts: BitBucketOptions
	) {}

	static async create(
		url: string,
		opts: BitBucketOptions,
		createOpts: CreateOptions
	): Promise<Provider> {
		const state = await BitBucket.getState(url, opts, createOpts);
		return new BitBucket(state, opts);
	}

	async fetch(resourcePath: string, { token, fetch: f = fetch }: FetchOptions): Promise<string> {
		const url = this.resolveRaw(resourcePath);
		try {
			const headers: Record<string, string> = {
				...(BitBucket.authHeader(token) ?? {}),
			};

			const response = await f(url.toString(), { headers });

			if (!response.ok) {
				throw new ProviderFetchError(
					`${response.status} ${response.statusText}`,
					url.toString()
				);
			}

			return await response.text();
		} catch (error) {
			if (error instanceof ProviderFetchError) {
				throw new ProviderFetchError(error.originalMessage, url.toString());
			}
			throw new ProviderFetchError(
				`${error instanceof Error ? error.message : String(error)}`,
				url.toString()
			);
		}
	}

	private static async getState(
		url: string,
		opts: BitBucketOptions,
		{ token, fetch: f = fetch }: CreateOptions
	): Promise<BitBucketState> {
		const parsedResult = BitBucket.parseUrl(url, opts);

		let { owner, repoName, ref, baseUrl } = parsedResult;

		// fetch default branch if ref was not provided
		if (ref === undefined) {
			try {
				const apiUrl = BitBucket.getApiUrl(parsedResult.baseUrl);
				const response = await f(
					new URL(`/repositories/${owner}/${repoName}`, apiUrl).toString(),
					{
						headers: BitBucket.authHeader(token),
					}
				);

				if (response.ok) {
					const res = await response.json();

					ref = res.mainbranch.name as string;
				} else {
					ref = DEFAULT_BRANCH;
				}
			} catch {
				ref = DEFAULT_BRANCH;
			}
		}

		return {
			owner,
			ref,
			repoName,
			baseUrl,
		};
	}

	private static parseUrl(url: string, opts: BitBucketOptions): BitBucketState {
		let baseUrl = opts.baseUrl ?? BASE_URL;
		if (url.startsWith('bitbucket:')) {
			baseUrl = new URL(url.slice(10)).origin;
		} else if (url.startsWith(BASE_URL)) {
			baseUrl = BASE_URL;
		}

		const repo = url.replaceAll(
			/(https:\/\/bitbucket.org\/)|(bitbucket\/)|(bitbucket:https?:\/\/[^/]+\/)/g,
			''
		);

		const [owner, repoName, ...rest] = repo.split('/');

		let ref: string | undefined;

		if (rest[0] === 'src') {
			ref = rest[1];
		}

		return {
			baseUrl,
			owner: owner!,
			repoName: repoName!,
			ref: ref,
		};
	}

	private static getApiUrl(baseUrl: string): string {
		const parsedBaseUrl = new URL(baseUrl ?? BASE_URL);
		return `${parsedBaseUrl.protocol}//api.${parsedBaseUrl.host}/2.0`;
	}

	private resolveRaw(resourcePath: string): URL {
		const { owner, repoName, ref, baseUrl } = this.state;

		return new URL(
			`repositories/${owner}/${repoName}/src/${ref}/${resourcePath}`,
			`${BitBucket.getApiUrl(baseUrl)}/`
		);
	}

	private static authHeader(token: string | undefined) {
		if (!token) return undefined;
		return {
			Authorization: `Bearer ${token}`,
		};
	}
}
