/*
	Installed from github/ieedan/std
*/

/** Returns a promise that immediately resolves to `T`, useful when you need to mix sync and async code.
 *
 * @param val
 *
 * ### Usage
 * ```ts
 * const promises: Promise<number>[] = [];
 *
 * promises.push(immediate(10));
 * ```
 */
export function immediate<T>(val: T): Promise<T> {
	return new Promise<T>((res) => res(val));
}
