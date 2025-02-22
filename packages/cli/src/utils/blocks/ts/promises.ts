/** Returns a promise that immediately resolves to `T`
 *
 * @param val
 */
export const noopPromise = <T>(val: T): Promise<T> => {
	return new Promise<T>((res) => res(val));
};
