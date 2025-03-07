/*
	Installed from github/ieedan/std
*/

/** Returns a promise that immediately resolves to `T`, useful when you need to mix sync and async code.
 *
 * ### Usage
 * ```ts
 * const promises: Promise<number>[] = [];
 *
 * promises.push(noopPromise(10));
 * ```
 *
 * @param val
 */
export const noopPromise = <T>(val: T) => new Promise<T>((res) => res(val));
