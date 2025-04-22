import color from 'chalk';
import type { ParseOptions, RegistryProvider, RegistryProviderState } from './types';

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
export const NAME_REGEX = /^(?![-0-9])(?!.*--)[a-z0-9]*(?:-[a-z0-9]+)*$/gi;

export const BASE_URL = 'http://localhost:5173';

export interface JsrepoProviderState extends RegistryProviderState {
	scope: string;
	registryName: string;
	version: string;
}

/** Valid paths
 *
 *  `@ieedan/std`
 *  `@ieedan/std@latest`
 *  `@ieedan/std@1.0.0`
 *  `@ieedan/std@1.0.0/ts/math`
 */
export const jsrepo: RegistryProvider = {
	name: 'jsrepo',

	matches: (url) => url.startsWith('@'),

	parse: (url, opts) => {
		const parsed = parseUrl(url, opts);

		return {
			url: parsed.url,
			specifier: parsed.specifier,
		};
	},

	baseUrl: (url) => {
		const { scope, registryName, version } = parseUrl(url, { fullyQualified: false });

		return `${BASE_URL}/${scope}/${registryName}/v/${version}`;
	},

	state: async (url) => {
		const parsed = parseUrl(url, { fullyQualified: false });

		return {
			...parsed,
			provider: jsrepo,
		} satisfies JsrepoProviderState;
	},

	resolveRaw: async (state, resourcePath) => {
		// essentially assert that we are using the correct state
		if (state.provider.name !== jsrepo.name) {
			throw new Error(
				`You passed the incorrect state object (${state.provider.name}) to the ${jsrepo.name} provider.`
			);
		}

		const { scope, registryName, version } = state as JsrepoProviderState;

		return new URL(
			`${BASE_URL}/api/scopes/${scope}/${registryName}/v/${version}/files/${resourcePath}`
		);
	},

	authHeader: (token) => ['x-api-key', token],

	formatFetchError: (state, filePath, error) => {
		return `There was an error fetching ${color.bold(new URL(filePath, state.url).toString())}
	
${color.bold(error)}`;
	},
};

export function parseUrl(
	url: string,
	{ fullyQualified }: ParseOptions
): {
	url: string;
	specifier?: string;
	scope: string;
	registryName: string;
	version: string;
} {
	const [scope, name, ...rest] = url.split('/');

	const [registryName, version] = name.split('@');

	let specifier: string | undefined = undefined;

	if (fullyQualified) {
		specifier = rest.slice(rest.length - 2).join('/');
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
