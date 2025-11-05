import type { CreateOptions, FetchOptions, Provider, ProviderFactory } from '@/providers/types';
import { ProviderFetchError } from '@/utils/errors';

const BASE_URL = 'https://dev.azure.com';
const DEFAULT_BRANCH = 'main';

export type AzureOptions = {
	/** If you are self hosting Azure DevOps and you want azure/ to default to your base url instead of https://dev.azure.com */
	baseUrl?: string;
};

/**
 * The built in Azure DevOps provider.
 * @param options
 * @returns
 *
 * @urlFormat
 * ```
 * 'azure/<org>/<project>/<repo>'
 * 'azure/<org>/<project>/<repo>/heads/<ref>'
 * 'azure/<org>/<project>/<repo>/tags/<ref>'
 * ```
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo/config";
 * import { azure } from "jsrepo/providers";
 *
 * export default defineConfig({
 * 	providers: [azure()],
 * });
 * ```
 */
export function azure(options: AzureOptions = {}): ProviderFactory {
	return {
		name: 'azure',
		matches: (url: string) =>
			url.startsWith(BASE_URL) || url.startsWith('azure/') || url.startsWith('azure:'),
		create: (url: string, createOpts: CreateOptions) => Azure.create(url, options, createOpts),
		auth: {
			tokenStoredFor: 'provider',
			envVar: 'AZURE_TOKEN',
		},
	};
}

type AzureState = {
	baseUrl: string;
	owner: string;
	repoName: string;
	project: string;
	refs: 'heads' | 'tags';
	ref: string;
};

class Azure implements Provider {
	constructor(
		readonly state: AzureState,
		readonly opts: AzureOptions
	) {}

	static async create(
		url: string,
		opts: AzureOptions,
		createOpts: CreateOptions
	): Promise<Provider> {
		const state = await Azure.getState(url, opts, createOpts);
		return new Azure(state, opts);
	}

	async fetch(
	async fetch(resourcePath: string, { token, fetch: f = fetch }: FetchOptions): Promise<string> {
		const url = this.resolveRaw(resourcePath);
		try {
			const headers: Record<string, string> = {
				...(Azure.authHeader(token) ?? {}),
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
			throw new ProviderFetchError(
				`${error instanceof Error ? error.message : String(error)}`,
				url.toString()
			);
		}
	}

	private static async getState(
		url: string,
		opts: AzureOptions,
		_createOpts: CreateOptions
	): Promise<AzureState> {
		return Azure.parseUrl(url, opts);
	}

	private static parseUrl(url: string, opts: AzureOptions): AzureState {
		let baseUrl = opts.baseUrl ?? BASE_URL;
		if (url.startsWith('azure:')) {
			baseUrl = new URL(url.slice(6)).origin;
		} else if (url.startsWith(BASE_URL)) {
			baseUrl = BASE_URL;
		}

		const repo = url.replaceAll(/(azure\/)|(azure:https?:\/\/[^/]+\/)/g, '');

		const [owner, project, repoName, ...rest] = repo.split('/');

		let ref: string = DEFAULT_BRANCH;

		// checks if the type of the ref is tags or heads
		let refs: 'heads' | 'tags' = 'heads';

		if (rest[0] && ['tags', 'heads'].includes(rest[0])) {
			refs = rest[0] as 'heads' | 'tags';

			if (rest[1] && rest[1] !== '') {
				ref = rest[1];
			}
		}

		return {
			baseUrl,
			owner: owner!,
			repoName: repoName!,
			project: project!,
			ref,
			refs,
		};
	}

	private resolveRaw(resourcePath: string): URL {
		const { owner, repoName, project, ref, refs, baseUrl } = this.state;

		const versionType = refs === 'tags' ? 'tag' : 'branch';

		return new URL(
			`${baseUrl}/${owner}/${project}/_apis/git/repositories/${repoName}/items?path=${resourcePath}&api-version=7.2-preview.1&versionDescriptor.version=${ref}&versionDescriptor.versionType=${versionType}`
		);
	}

	private static authHeader(token: string | undefined) {
		if (!token) return undefined;
		return {
			Authorization: `Bearer ${token}`,
		};
	}
}
