export type MaybeGetter<T, Args extends unknown[] = unknown[]> = T | ((...args: Args) => T);

export function extract<T, Args extends unknown[] = unknown[]>(
	getter: MaybeGetter<T, Args>,
	...args: Args
): T {
	if (isFunction<T, Args>(getter)) return getter(...args);
	return getter;
}

export type MaybeGetterAsync<T, Args extends unknown[] = unknown[]> =
	| MaybeGetter<T, Args>
	| ((...args: Args) => Promise<T>);

export async function extractAsync<T, Args extends unknown[] = unknown[]>(
	getter: MaybeGetterAsync<T, Args>,
	...args: Args
): Promise<T> {
	if (isFunctionAsync<T, Args>(getter)) return await getter(...args);
	return getter;
}

export function isFunction<T, Args extends unknown[] = unknown[]>(
	value: unknown
): value is (...args: Args) => T {
	return typeof value === 'function';
}

export function isFunctionAsync<T, Args extends unknown[] = unknown[]>(
	value: unknown
): value is ((...args: Args) => T) | ((...args: Args) => Promise<T>) {
	return typeof value === 'function';
}

export function debounced<Args extends unknown[] = unknown[]>(
	fn: (...args: Args) => void,
	delay: number
): (...args: Args) => void {
	let timeout: NodeJS.Timeout | null = null;
	return (...args: Args) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
}

/** Await this to pause execution until the duration has passed.
 *
 * @param durationMs The duration in ms until the sleep in over
 * @returns
 *
 * ## Usage
 * ```ts
 * console.log(Date.now()) // 1725739228744
 *
 * await sleep(1000);
 *
 * console.log(Date.now()) // 1725739229744
 * ```
 */
export function sleep(durationMs: number): Promise<void> {
	return new Promise((res) => setTimeout(res, durationMs));
}
