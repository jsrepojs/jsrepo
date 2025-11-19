import type { CreateOptions, FetchOptions, Provider, ProviderFactory } from '@/providers/types';
import { ProviderFetchError } from '@/utils/errors';

const BASE_URL = 'https://gitlab.com';
const DEFAULT_BRANCH = 'main';

export type GitLabOptions = {
	/** If you are self hosting GitLab and you want gitlab/ to default to your base url instead of https://gitlab.com */
	baseUrl?: string;
};

/**
 * The built in GitLab provider.
 * @param options
 * @returns
 *
 * @urlFormat
 * ```
 * 'https://gitlab.com/<owner>/<repo>'
 * 'gitlab/<owner>/<repo>'
 * 'gitlab/<owner>/<repo>/-/tree/<ref>'
 * 'gitlab/<owner>/[...group]/<repo>'
 * ```
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo/config";
 * import { gitlab } from "jsrepo/providers";
 *
 * export default defineConfig({
 * 	providers: [gitlab()],
 * });
 * ```
 */
export function gitlab(options: GitLabOptions = {}): ProviderFactory {
	return {
		name: 'gitlab',
		matches: (url: string) =>
			url.startsWith(options.baseUrl ?? BASE_URL) ||
			url.startsWith('gitlab/') ||
			url.startsWith('gitlab:'),
		create: (url: string, createOpts: CreateOptions) => GitLab.create(url, options, createOpts),
		auth: {
			tokenStoredFor: 'provider',
			envVar: 'GITLAB_TOKEN',
		},
	};
}

type GitLabState = {
	baseUrl: string;
	url: string;
	/** The id is the full path with all groups and the repo name */
	id: string;
	ref?: string;
};

class GitLab implements Provider {
	constructor(
		readonly state: GitLabState,
		readonly opts: GitLabOptions
	) {}

	static async create(
		url: string,
		opts: GitLabOptions,
		createOpts: CreateOptions
	): Promise<Provider> {
		const state = await GitLab.getState(url, opts, createOpts);
		return new GitLab(state, opts);
	}

	async fetch(resourcePath: string, { token, fetch: f = fetch }: FetchOptions): Promise<string> {
		const url = this.resolveRaw(resourcePath);
		try {
			const headers: Record<string, string> = {
				...(GitLab.authHeader(token) ?? {}),
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
		opts: GitLabOptions,
		{ token, fetch: f = fetch }: CreateOptions
	): Promise<GitLabState> {
		const parsedResult = GitLab.parseUrl(url, opts);

		let { id, ref } = parsedResult;

		// fetch default branch if ref was not provided
		if (ref === undefined) {
			try {
				const apiUrl = GitLab.getApiUrl(parsedResult.baseUrl);
				const response = await f(
					new URL(`/projects/${encodeURIComponent(id)}`, apiUrl).toString(),
					{
						headers: GitLab.authHeader(token),
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
			id,
			ref,
			url,
			baseUrl: opts.baseUrl ?? BASE_URL,
		};
	}

	private static parseUrl(url: string, opts: GitLabOptions): GitLabState {
		let baseUrl = opts.baseUrl ?? BASE_URL;
		if (url.startsWith('gitlab:')) {
			baseUrl = new URL(url.slice(7)).origin;
		} else if (url.startsWith(BASE_URL)) {
			baseUrl = BASE_URL;
		}

		const repo = url.replaceAll(
			/gitlab\/|https:\/\/gitlab\.com\/|gitlab:https?:\/\/[^/]+\//g,
			''
		);

		let id = repo;
		const refStartIndex = repo.indexOf('/-/tree/');
		let ref: string | undefined;
		if (refStartIndex !== -1) {
			ref = repo.slice(refStartIndex + 8);
			const searchParamIndex = ref.indexOf('?');
			if (searchParamIndex !== -1) {
				ref = ref.slice(0, searchParamIndex);
			}
			id = id.slice(0, refStartIndex);
		}

		return {
			baseUrl,
			id,
			ref,
			url,
		};
	}

	private static getApiUrl(baseUrl: string): string {
		const parsedBaseUrl = new URL(baseUrl ?? BASE_URL);
		return `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}/api/v4`;
	}

	private resolveRaw(resourcePath: string): URL {
		const { id, ref, baseUrl } = this.state;

		return new URL(
			`projects/${encodeURIComponent(id)}/repository/files/${encodeURIComponent(
				resourcePath
			)}/raw?ref=${ref}`,
			`${GitLab.getApiUrl(baseUrl)}/`
		);
	}

	private static authHeader(token: string | undefined) {
		if (!token) return undefined;
		return {
			'PRIVATE-TOKEN': token,
		};
	}
}
