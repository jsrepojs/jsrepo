import type Conf from 'conf';
import * as persisted from './persisted';

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

		return this.#storage.get(key, undefined) as string | undefined;
	}

	set(name: string, secret: string) {
		const key = this.getKey(name);

		this.#storage.set(key, secret);
	}

	delete(name: string) {
		const key = this.getKey(name);

		this.#storage.delete(key);
	}
}
