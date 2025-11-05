import type {
	cancel,
	confirm,
	groupMultiselect,
	isCancel,
	log,
	multiselect,
	password,
	select,
	spinner,
	text,
} from '@clack/prompts';
import type pc from 'picocolors';

export type FetchOptions = {
	token: string | undefined;
	fetch?: typeof fetch;
};

export type CreateOptions = {
	token: string | undefined;
	fetch?: typeof fetch;
	cwd: string;
};

export type Prompts = {
	multiselect: typeof multiselect;
	select: typeof select;
	text: typeof text;
	log: typeof log;
	password: typeof password;
	spinner: typeof spinner;
	confirm: typeof confirm;
	groupMultiselect: typeof groupMultiselect;
	isCancel: typeof isCancel;
	cancel: typeof cancel;
	color: typeof pc;
};

export type GetToken = (options: {
	/**
	 * Prompts to use to authenticate the user.
	 */
	p: Prompts;
}) => Promise<string>;

export type GetTokenWithRegistry = (options: {
	/**
	 * The registry the user is attempting to authenticate to.
	 */
	registry: string;
	/**
	 * Prompts to use to authenticate the user.
	 */
	p: Prompts;
}) => Promise<string>;

export interface ProviderFactory {
	/** Must be unique used for identifying the provider. */
	name: string;
	/** Determines whether or not the provider can handle the given URL. */
	matches(url: string): boolean;
	create(url: string, createOpts: CreateOptions): Promise<Provider>;
	/**
	 * Configures how jsrepo will authenticate the user for this provider.
	 *
	 * Leaving this blank if your provider doesn't require authentication.
	 */
	auth?:
		| {
				/**
				 * Configures how jsrepo will store the token for this provider.
				 *
				 * - "provider" - Tokens are stored at the provider level and used by all registries for this provider.
				 * - "registry" - Tokens are stored at the registry level and used only by that registry.
				 */
				tokenStoredFor: 'provider';
				/**
				 * Name of the environment variable to fallback on if no token is provided.
				 */
				envVar?: string;
				/**
				 * Authenticate the user for this provider by returning a token.
				 *
				 * If left blank jsrepo will prompt the user for a token.
				 *
				 * @param options
				 * @returns
				 */
				getToken?: GetToken;
		  }
		| {
				/**
				 * Configures how jsrepo will store the token for this provider.
				 *
				 * - "provider" - Tokens are stored at the provider level and used by all registries for this provider.
				 * - "registry" - Tokens are stored at the registry level and used only by that registry.
				 */
				tokenStoredFor: 'registry';
				/**
				 * Authenticate the user for this provider/registry by returning a token.
				 *
				 * If left blank jsrepo will prompt the user for a token.
				 *
				 * @param options
				 * @returns
				 */
				getToken?: GetTokenWithRegistry;
		  };
}

export interface Provider {
	fetch(resourcePath: string, fetchOpts?: FetchOptions): Promise<string>;
}
