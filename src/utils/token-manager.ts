import type Conf from 'conf';
import * as persisted from './persisted';

const HTTP_REGISTRY_LIST_KEY = 'http-registries-w-tokens';

export class TokenManager {
	#storage: Conf;

	constructor(storage?: Conf) {
		this.#storage = storage ?? persisted.get();
	}

	private getKey(name: string) {
		return `${name}-token`.toLowerCase();
	}

	get(name: string): string | undefined {
		const key = this.getKey(name);

		const token = this.#storage.get(key, undefined) as string | undefined;

		if (name === 'jsrepo') {
			return token ?? process.env.JSREPO_TOKEN;
		}

		return token;
	}

	set(name: string, secret: string) {
		if (name.startsWith('http')) {
			let registries = this.getHttpRegistriesWithTokens();

			const registry = name.slice(5);

			if (!registries) {
				registries = [];
			}

			if (!registries.includes(registry)) registries.push(registry);

			this.#storage.set(HTTP_REGISTRY_LIST_KEY, registries);
		}

		const key = this.getKey(name);

		this.#storage.set(key, secret);
	}

	delete(name: string) {
		if (name.startsWith('http')) {
			let registries = this.getHttpRegistriesWithTokens();

			const registry = name.slice(5);

			const index = registries.indexOf(registry);

			if (index !== -1) {
				registries = [...registries.slice(0, index), ...registries.slice(index + 1)];
			}

			this.#storage.set(HTTP_REGISTRY_LIST_KEY, registries);
		}

		const key = this.getKey(name);

		this.#storage.delete(key);
	}

	getHttpRegistriesWithTokens(): string[] {
		const registries = this.#storage.get(HTTP_REGISTRY_LIST_KEY);

		if (!registries) return [];

		return registries as string[];
	}
}
