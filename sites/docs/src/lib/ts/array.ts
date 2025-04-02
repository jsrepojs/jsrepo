/*
	Installed from github/ieedan/std
*/

/** Maps the provided map into an array using the provided mapping function.
 *
 * @param map Map to be entered into an array
 * @param fn A mapping function to transform each pair into an item
 * @returns
 *
 * ## Example
 * ```ts
 * console.log(map); // Map(5) { 0 => 5, 1 => 4, 2 => 3, 3 => 2, 4 => 1 }
 *
 * const arr = fromMap(map, (_, value) => value);
 *
 * console.log(arr); // [5, 4, 3, 2, 1]
 * ```
 */
export const fromMap = <K, V, T>(map: Map<K, V>, fn: (key: K, value: V) => T): T[] => {
	const items: T[] = [];

	for (const [key, value] of map) {
		items.push(fn(key, value));
	}

	return items;
};

/** Calculates the sum of all elements in the array based on the provided function.
 *
 * @param arr Array of items to be summed.
 * @param fn Summing function
 * @returns
 *
 * ## Examples
 *
 * ```ts
 * const total = sum([1, 2, 3, 4, 5], (num) => num);
 *
 * console.log(total); // 15
 * ```
 */
export const sum = <T>(arr: T[], fn: (item: T) => number): number => {
	let total = 0;

	for (const item of arr) {
		total = total + fn(item);
	}

	return total;
};

type Options = {
	replace?: boolean;
};

/** Maps the provided array into a map
 *
 * @param arr Array of items to be entered into a map
 * @param fn A mapping function to transform each item into a key value pair
 * @returns
 *
 * ## Example
 * ```ts
 * const map = toMap([5, 4, 3, 2, 1], (item, i) => [i, item]);
 *
 * console.log(map); // Map(5) { 0 => 5, 1 => 4, 2 => 3, 3 => 2, 4 => 1 }
 * ```
 */
export const toMap = <T, K, V>(
	arr: T[],
	fn: (item: T, index: number) => [key: K, value: V],
	{ replace = false }: Options = {}
): Map<K, V> => {
	const map = new Map<K, V>();

	for (let i = 0; i < arr.length; i++) {
		const [key, value] = fn(arr[i], i);

		if (!replace && map.has(key)) continue;

		map.set(key, value);
	}

	return map;
};
