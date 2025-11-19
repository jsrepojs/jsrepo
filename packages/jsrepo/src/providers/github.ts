import type { CreateOptions, FetchOptions, Provider, ProviderFactory } from '@/providers/types';
import { ProviderFetchError } from '@/utils/errors';

const BASE_URL = 'https://github.com';
const DEFAULT_BRANCH = 'main';

export type GitHubOptions = {
	/** If you are self hosting GitHub and you want github/ to default to your base url instead of https://github.com */
	baseUrl?: string;
};

/**
 * The built in GitHub provider.
 * @param options
 * @returns
 *
 * @urlFormat
 * ```
 * 'https://github.com/<owner>/<repo>'
 * 'github/<owner>/<repo>'
 * 'github/<owner>/<repo>/tree/<ref>'
 * ```
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo/config";
 * import { github } from "jsrepo/providers";
 *
 * export default defineConfig({
 * 	providers: [github()],
 * });
 * ```
 */
export function github(options: GitHubOptions = {}): ProviderFactory {
	return {
		name: 'github',
		matches: (url: string) =>
			url.startsWith(options.baseUrl ?? BASE_URL) ||
			url.startsWith('github/') ||
			url.startsWith('github:'),
		create: (url: string, createOpts: CreateOptions) => GitHub.create(url, options, createOpts),
		auth: {
			tokenStoredFor: 'provider',
			envVar: 'GITHUB_TOKEN',
		},
	};
}

type GitHubState = {
	baseUrl: string;
	url: string;
	owner: string;
	repoName: string;
	ref: string;
};

class GitHub implements Provider {
	constructor(
		readonly state: GitHubState,
		readonly opts: GitHubOptions
	) {}

	static async create(
		url: string,
		opts: GitHubOptions,
		createOpts: CreateOptions
	): Promise<Provider> {
		const state = await GitHub.getState(url, opts, createOpts);
		return new GitHub(state, opts);
	}

	async fetch(resourcePath: string, { token, fetch: f = fetch }: FetchOptions): Promise<string> {
		const url = this.resolveRaw(resourcePath);
		try {
			const headers: Record<string, string> = {
				...(GitHub.authHeader(token) ?? {}),
				Accept: 'application/vnd.github.raw+json',
			};

			const response = await f(url.toString(), { headers });

			if (!response.ok) {
				const isJson = response.headers.get('content-type')?.includes('application/json');
				if (isJson) {
					throw new ProviderFetchError(
						`${response.status} ${(await response.json()).message ?? response.statusText}`,
						url.toString()
					);
				}
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
		opts: GitHubOptions,
		{ token, fetch: f = fetch }: CreateOptions
	): Promise<GitHubState> {
		const parsedResult = GitHub.parseUrl(url, opts);

		let { owner, repoName, ref } = parsedResult;

		// fetch default branch if ref was not provided
		if (ref === undefined) {
			try {
				const apiUrl = GitHub.getApiUrl(opts.baseUrl ?? BASE_URL);
				const response = await f(
					new URL(`/repos/${owner}/${repoName}`, apiUrl).toString(),
					{
						headers: GitHub.authHeader(token),
					}
				);

				if (response.ok) {
					const res = await response.json();
					ref = res.default_branch as string;
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
			url,
			baseUrl: opts.baseUrl ?? BASE_URL,
		};
	}

	private static parseUrl(
		url: string,
		opts: GitHubOptions
	): {
		baseUrl: string;
		owner: string;
		repoName: string;
		ref?: string;
	} {
		let baseUrl = opts.baseUrl ?? BASE_URL;
		if (url.startsWith('github:')) {
			baseUrl = new URL(url.slice(7)).origin;
		} else if (url.startsWith(BASE_URL)) {
			baseUrl = BASE_URL;
		}

		const repo = url.replaceAll(
			/github\/|https:\/\/github\.com\/|github:https?:\/\/[^/]+\//g,
			''
		);

		const [owner, repoName, ...rest] = repo.split('/');

		let ref: string | undefined;

		if (rest.length > 0) {
			if (rest[0] === 'tree' && rest[1]) {
				ref = rest[1];
			}
		}

		if (!owner || !repoName) {
			throw new Error(`Failed to parse invalid URL: ${url}`);
		}

		return {
			baseUrl,
			owner: owner,
			repoName: repoName,
			ref,
		};
	}

	private resolveRaw(resourcePath: string): URL {
		const { owner, repoName, ref, baseUrl } = this.state;

		return new URL(
			`${resourcePath}?ref=${ref}`,
			`${GitHub.getApiUrl(baseUrl)}/repos/${owner}/${repoName}/contents/`
		);
	}

	private static getApiUrl(baseUrl: string): string {
		const parsedBaseUrl = new URL(baseUrl ?? BASE_URL);
		return `${parsedBaseUrl.protocol}//api.${parsedBaseUrl.host}`;
	}

	private static authHeader(token: string | undefined) {
		if (!token) return undefined;
		return {
			Authorization: `Bearer ${token}`,
		};
	}
}
