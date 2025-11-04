import type Conf from 'conf';
import type { ProviderFactory } from '@/providers';
import * as persisted from '@/utils/persisted';
import { JsrepoError } from './errors';

export class TokenManager {
	#storage: Conf;

	constructor(storage?: Conf) {
		this.#storage = storage ?? persisted.get();
	}

	get(provider: ProviderFactory, registry: string | undefined): string | undefined {
		if (provider.auth?.tokenStoredFor === 'registry') {
			const tokens = this.getProviderRegistryTokens(provider);

			if (!registry) {
				throw new JsrepoError('No registry was provided to get when one was expected', {
					suggestion:
						'This is a bug in jsrepo. Please report it here https://github.com/jsrepo/jsrepo/issues',
				});
			}

			return tokens[registry];
		} else {
			const token = this.#storage.get(provider.name, undefined) as string | undefined;

			// fallback on environment variable
			if (provider.auth?.envVar) {
				return token ?? process.env[provider.auth.envVar];
			}

			return token;
		}
	}

	set(provider: ProviderFactory, registry: string | undefined, secret: string) {
		if (provider.auth?.tokenStoredFor === 'registry') {
			if (!registry) {
				throw new JsrepoError('No registry was provided to set when one was expected', {
					suggestion:
						'This is a bug in jsrepo. Please report it here https://github.com/jsrepo/jsrepo/issues',
				});
			}

			this.setProviderRegistryToken(provider, registry, secret);
		} else {
			this.#storage.set(provider.name, secret);
		}
	}

	delete(provider: ProviderFactory, registry: string | undefined) {
		if (provider.auth?.tokenStoredFor === 'registry') {
			const tokens = this.getProviderRegistryTokens(provider);
			if (!registry) {
				throw new JsrepoError('No registry was provided to delete when one was expected', {
					suggestion:
						'This is a bug in jsrepo. Please report it here https://github.com/jsrepo/jsrepo/issues',
				});
			}
			delete tokens[registry];
			this.#storage.set(provider.name, tokens);
		} else {
			this.#storage.delete(provider.name);
		}
	}

	getProviderRegistryTokens(provider: ProviderFactory): Record<string, string> {
		const tokens = this.#storage.get(provider.name) as Record<string, string> | undefined;

		return tokens ?? {};
	}

	setProviderRegistryToken(provider: ProviderFactory, registry: string, token: string) {
		const tokens = this.getProviderRegistryTokens(provider);
		tokens[registry] = token;
		this.#storage.set(provider.name, tokens);
	}
}
