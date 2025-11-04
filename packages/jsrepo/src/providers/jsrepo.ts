import nodeMachineId from 'node-machine-id';
import type {
	CreateOptions,
	FetchOptions,
	GetToken,
	Provider,
	ProviderFactory,
} from '@/providers/types';
import { JsrepoError, ProviderFetchError } from '@/utils/errors';
import { addTrailingSlash } from '@/utils/url';
import { sleep } from '@/utils/utils';

/** Regex for scopes and registry names.
 * Names that don't match this regex will be rejected.
 *
 * ### Valid
 * ```txt
 * console
 * console0
 * console-0
 * ```
 *
 * ### Invalid
 * ```txt
 * Console
 * 0console
 * -console
 * console-
 * console--0
 * ```
 */
export const NAME_REGEX = /^(?![-0-9])(?!.*--)[a-z0-9]*(?:-[a-z0-9]+)*$/i;

const BASE_URL = 'https://www.jsrepo.com';

export type JsrepoOptions = {
	baseUrl?: string;
};

/**
 * The built in jsrepo provider.
 * @param options
 * @returns
 *
 * @urlFormat
 *
 * ```
 * '@<scope>/<registry>'
 * '@<scope>/<registry>@<version>'
 * ```
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo/config";
 * import { jsrepo } from "jsrepo/providers";
 *
 * export default defineConfig({
 * 	providers: [jsrepo()],
 * });
 * ```
 */
export function jsrepo(options: JsrepoOptions = {}): ProviderFactory {
	return {
		name: 'jsrepo',
		matches: (url: string) => url.startsWith('@'),
		create: (url: string, createOpts: CreateOptions) => Jsrepo.create(url, options, createOpts),
		auth: {
			tokenStoredFor: 'provider',
			envVar: 'JSREPO_TOKEN',
			getToken,
		},
	};
}

type JsrepoState = {
	baseUrl: string;
	url: string;
	scope: string;
	registryName: string;
	version: string;
	specifier?: string;
};

class Jsrepo implements Provider {
	constructor(
		readonly state: JsrepoState,
		readonly opts: JsrepoOptions
	) {}

	static async create(
		url: string,
		opts: JsrepoOptions,
		_createOpts: CreateOptions
	): Promise<Provider> {
		const state = await Jsrepo.getState(url, opts);
		return new Jsrepo(state, opts);
	}

	async fetch(
		resourcePath: string,
		{ token, fetch: f = fetch }: FetchOptions = {}
	): Promise<string> {
		const url = this.resolveRaw(resourcePath);
		try {
			const headers: Record<string, string> = {
				...(Jsrepo.authHeader(token) ?? {}),
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

	private static async getState(url: string, opts: JsrepoOptions): Promise<JsrepoState> {
		const parsed = Jsrepo.parseUrl(url);

		return {
			...parsed,
			baseUrl: opts.baseUrl ?? BASE_URL,
		};
	}

	private static parseUrl(url: string): {
		url: string;
		specifier?: string;
		scope: string;
		registryName: string;
		version: string;
	} {
		const [scope, name, ...rest] = url.split('/');

		if (!scope || !name) {
			throw new Error(`Failed to parse invalid URL: ${url}`);
		}

		const [registryName, version] = name.split('@');

		if (!registryName) {
			throw new Error(`Failed to parse invalid URL: ${url}`);
		}

		let specifier: string | undefined;

		if (rest.length > 0) {
			specifier = rest.join('/');
		}

		const parsedUrl = `${scope}/${name}`;

		return {
			url: parsedUrl,
			specifier,
			scope,
			registryName,
			version: version ?? 'latest',
		};
	}

	private resolveRaw(resourcePath: string): URL {
		const { scope, registryName, version, baseUrl } = this.state;

		return new URL(
			`${addTrailingSlash(baseUrl)}api/scopes/${scope}/${registryName}/v/${version}/files/${resourcePath}`
		);
	}

	private static authHeader(token: string | undefined): Record<string, string> | undefined {
		if (!token) return undefined;
		return {
			'x-api-key': token,
		};
	}
}

/**
 * Initiates the device auth flow for jsrepo.com. Polls until the user has signed in through the site.
 *
 * @param param0
 * @returns
 */
const getToken: GetToken = async ({ p }) => {
	const hardwareId = nodeMachineId.machineIdSync(true);

	let anonSessionId: string;

	try {
		const response = await fetch(`${BASE_URL}/api/login/device`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ hardwareId }),
		});

		if (!response.ok) {
			throw new Error('There was an error creating the session');
		}

		const res = await response.json();

		anonSessionId = res.id;
	} catch (err) {
		throw new JsrepoError(err instanceof Error ? err.message : String(err), {
			suggestion: 'Please try again.',
		});
	}

	p.log.step(`Sign in at ${p.color.cyan(`${BASE_URL}/login/device/${anonSessionId}`)}`);

	const timeout = 1000 * 60 * 60 * 15; // 15 minutes

	const loading = p.spinner();

	const pollingTimeout = setTimeout(() => {
		loading.stop('You never signed in.');

		throw new JsrepoError('Session timed out!', {
			suggestion: 'Please try again.',
		});
	}, timeout);

	loading.start('Waiting for you to sign in...');

	while (true) {
		// wait initially cause c'mon ain't no way
		await sleep(5000); // wait 5 seconds

		const endpoint = `${BASE_URL}/api/login/device/${anonSessionId}`;

		try {
			const response = await fetch(endpoint, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ hardwareId }),
			});

			if (!response.ok) continue;

			clearTimeout(pollingTimeout);

			const token = await response.text();

			loading.stop('Done');

			return token;
		} catch {
			// continue
		}
	}
};
