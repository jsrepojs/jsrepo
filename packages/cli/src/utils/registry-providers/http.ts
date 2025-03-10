import color from 'chalk';
import * as u from '../blocks/ts/url';
import type { ParseOptions, RegistryProvider, RegistryProviderState } from './types';

export interface HttpProviderState extends RegistryProviderState {}

/** Valid paths
 *
 *  `(https|http)://example.com`
 */
export const http: RegistryProvider = {
	name: 'http',

	matches: (url) => {
		// if parsing is a success then it's a match
		try {
			new URL(url);

			return true;
		} catch {
			return false;
		}
	},

	parse: (url, opts) => {
		const parsed = parseUrl(url, opts);

		return {
			url: parsed.url,
			specifier: parsed.specifier,
		};
	},

	baseUrl: (url) => {
		const { url: u } = parseUrl(url, { fullyQualified: false });

		return new URL(u).origin;
	},

	state: async (url) => {
		const { url: normalizedUrl } = parseUrl(url, { fullyQualified: false });

		return {
			url: normalizedUrl,
			provider: http,
		} satisfies HttpProviderState;
	},

	resolveRaw: async (state, resourcePath) => {
		// essentially assert that we are using the correct state
		if (state.provider.name !== http.name) {
			throw new Error(
				`You passed the incorrect state object (${state.provider.name}) to the ${http.name} provider.`
			);
		}

		return new URL(resourcePath, state.url);
	},

	authHeader: (token) => ['Authorization', `Bearer ${token}`],

	formatFetchError: (state, filePath, error) => {
		return `There was an error fetching ${color.bold(new URL(filePath, state.url).toString())}
	
${color.bold(error)}`;
	},
};

const parseUrl = (
	url: string,
	{ fullyQualified }: ParseOptions
): {
	url: string;
	specifier?: string;
} => {
	const parsedUrl = new URL(url);

	let segments = parsedUrl.pathname.split('/');

	let specifier: string | undefined;

	if (fullyQualified) {
		specifier = segments.slice(segments.length - 2).join('/');

		segments = segments.slice(0, segments.length - 2);
	}

	return {
		url: u.addTrailingSlash(u.join(parsedUrl.origin, ...segments)),
		specifier,
	};
};
