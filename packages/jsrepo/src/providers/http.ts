import type { FetchOptions, Provider, ProviderFactory } from '@/providers/types';
import { ProviderFetchError } from '@/utils/errors';
import { addTrailingSlash } from '@/utils/url';

export type HttpOptions =
	| {
			baseUrl?: never;
			/**
			 * Override the auth header for all sites.
			 *
			 * @default
			 * ```ts
			 * (token) => ({ Authorization: `Bearer ${token}` })
			 * ```
			 */
			authHeader?: (token: string) => Record<string, string>;
	  }
	| {
			/** The base url for your site. */
			baseUrl: string;
			/** The auth header for your site. */
			authHeader?: (token: string) => Record<string, string>;
	  };

/**
 * The built in http provider. When using this provider you should place it at the end of the providers array otherwise it will match all urls.
 * @param options
 * @returns
 *
 * @urlFormat
 * ```
 * 'https://<domain>/<path to registry.json>'
 * ```
 *
 * @note
 * If you aren't providing a base url then you should place this provider at the end of the providers array. Otherwise it will match all urls.
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo/config";
 * import { http } from "jsrepo/providers";
 *
 * export default defineConfig({
 * 	providers: [http()],
 * });
 * ```
 * @example
 * ### Custom Provider
 * ```ts
 * import { defineConfig } from "jsrepo/config";
 * import { http } from "jsrepo/providers";
 *
 * export default defineConfig({
 * 	providers: [http({
 *      baseUrl: "https://privateui.com",
 *      authHeader: (token) => ({
 *          "Token": token
 *      })
 *  })],
 * });
 * ```
 *
 * Now when you use `https://privateui.com` it will use the auth header you provided.
 */
export function http(options: HttpOptions = {}): ProviderFactory {
	return {
		name: 'http',
		matches: (url: string) => {
			if (options.baseUrl) {
				return url.startsWith(options.baseUrl);
			}

			return url.startsWith('http');
		},
		create: (url: string) => Http.create(url, options),
		auth: {
			tokenStoredFor: 'registry',
		},
	};
}

type HttpState = {
	url: string;
};

class Http implements Provider {
	constructor(
		readonly state: HttpState,
		readonly opts: HttpOptions
	) {}

	async fetch(resourcePath: string, { token, fetch: f = fetch }: FetchOptions): Promise<string> {
		const url = this.resolveRaw(resourcePath);
		try {
			const headers: Record<string, string> = {
				...(this.authHeader(token) ?? {}),
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

	private resolveRaw(resourcePath: string): URL {
		return new URL(resourcePath, addTrailingSlash(this.state.url));
	}

	private authHeader(token: string | undefined): Record<string, string> | undefined {
		if (!token) return;
		return this.opts.authHeader
			? this.opts.authHeader(token)
			: { Authorization: `Bearer ${token}` };
	}

	static async create(url: string, opts: HttpOptions): Promise<Provider> {
		return new Http({ url }, opts);
	}
}
