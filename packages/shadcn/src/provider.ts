import { JsrepoError, ProviderFetchError } from 'jsrepo/errors';
import type { CreateOptions, FetchOptions, Provider, ProviderFactory } from 'jsrepo/providers';

export type ShadcnOptions = {
	/**
	 * The base url of the registry index.
	 *
	 * @default https://ui.shadcn.com/r/registries.json
	 */
	registryIndexUrl?: string;
};

/**
 * A provider for the shadcn registry index.
 * @param options
 * @returns
 *
 * @urlFormat
 * ```
 * shadcn:@react-bits
 * ```
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo/config";
 * import shadcn from "@jsrepo/shadcn";
 *
 * export default defineConfig({
 * 	providers: [shadcn()],
 * });
 * ```
 */
export function provider(options: ShadcnOptions = {}): ProviderFactory {
	return {
		name: 'shadcn',
		matches: (url: string) => url.startsWith('shadcn:'),
		create: (url: string, createOpts: CreateOptions) => Shadcn.create(url, options, createOpts),
	};
}

type ShadcnState = {
	registryUrl: string;
};

class Shadcn implements Provider {
	constructor(
		readonly state: ShadcnState,
		readonly opts: ShadcnOptions
	) {}

	async fetch(resourcePath: string, { fetch: f = fetch }: FetchOptions): Promise<string> {
		const url = this.state.registryUrl.replace('{name}', resourcePath.replace('.json', ''));
		try {
			const response = await f(url.toString());

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

	static async create(
		url: string,
		opts: ShadcnOptions,
		{ fetch: f = fetch }: CreateOptions
	): Promise<Provider> {
		const registry = url.slice('shadcn:'.length);
		const indexUrl = opts.registryIndexUrl ?? 'https://ui.shadcn.com/r/registries.json';
		try {
			const response = await f(indexUrl);

			if (!response.ok) {
				throw new JsrepoError(
					`Failed to fetch registry index ${response.status} ${response.statusText}`,
					{
						suggestion: 'Please try again',
					}
				);
			}

			const res = (await response.json()) as Record<string, string>;

			const registryUrl = res[registry];
			if (!registryUrl) {
				throw new JsrepoError(`Registry ${registry} not found in registry index`, {
					suggestion: 'Please check the registry name',
				});
			}

			return new Shadcn({ registryUrl }, opts);
		} catch {
			throw new JsrepoError(`Failed to fetch registry index at ${indexUrl}`, {
				suggestion: 'Please try again',
			});
		}
	}
}
