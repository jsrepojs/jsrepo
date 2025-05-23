import type Conf from 'conf';
import * as persisted from './persisted';
import type { AccessToken } from './registry-providers';

const HTTP_REGISTRY_LIST_KEY = 'http-registries-w-tokens';

export class AccessTokenManager {
	private version = 1;
	private static storage: Conf = persisted.get();

	private getKey(name: string) {
		return `v${this.version}-${name}-token`.toLowerCase();
	}

	get(name: string): AccessToken | undefined {
		const key = this.getKey(name);

		const token = (AccessTokenManager.storage.get(key, undefined) as AccessToken) ?? undefined;

		if (name === 'jsrepo') {
			const apiToken = process.env.JSREPO_TOKEN
				? { type: 'api', token: process.env.JSREPO_TOKEN }
				: undefined;

			return token ?? apiToken;
		}

		return token;
	}

	set(name: string, token: AccessToken) {
		if (name.startsWith('http')) {
			let registries = this.getHttpRegistriesWithTokens();

			const registry = name.slice(5);

			if (!registries) {
				registries = [];
			}

			if (!registries.includes(registry)) registries.push(registry);

			AccessTokenManager.storage.set(HTTP_REGISTRY_LIST_KEY, registries);
		}

		const key = this.getKey(name);

		AccessTokenManager.storage.set(key, token);
	}

	delete(name: string) {
		if (name.startsWith('http')) {
			let registries = this.getHttpRegistriesWithTokens();

			const registry = name.slice(5);

			const index = registries.indexOf(registry);

			if (index !== -1) {
				registries = [...registries.slice(0, index), ...registries.slice(index + 1)];
			}

			AccessTokenManager.storage.set(HTTP_REGISTRY_LIST_KEY, registries);
		}

		const key = this.getKey(name);

		AccessTokenManager.storage.delete(key);
	}

	getHttpRegistriesWithTokens(): string[] {
		const registries = AccessTokenManager.storage.get(HTTP_REGISTRY_LIST_KEY);

		if (!registries) return [];

		return registries as string[];
	}
}
