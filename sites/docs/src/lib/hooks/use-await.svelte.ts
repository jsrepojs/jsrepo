export class UseAwait<T> {
    #resolved = $state(false);
    #fallback = $state<T>();
    #resolvedValue: T | undefined = $state(undefined);

    constructor(promise: Promise<T>, fallback?: T) {
        this.#fallback = fallback;

        promise.then((v) => {
            this.#resolved = true;
            this.#resolvedValue = v
        })
    }

    get current() {
        return this.#resolved ? this.#resolvedValue : this.#fallback;
    }
}