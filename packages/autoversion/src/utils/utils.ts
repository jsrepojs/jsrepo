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
