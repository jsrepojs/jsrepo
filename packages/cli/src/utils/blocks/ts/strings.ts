/*
	Installed from github/ieedan/std
*/

/** Returns true if `str` starts with one of the provided `strings`.
 *
 * @param str
 * @param strings
 * @returns
 *
 * ## Usage
 * ```ts
 * startsWithOneOf('ab', 'a', 'c'); // true
 * startsWithOneOf('cc', 'a', 'b'); // false
 * ```
 */
export function startsWithOneOf(str: string, strings: string[]): boolean {
	for (const s of strings) {
		if (str.startsWith(s)) return true;
	}

	return false;
}

/** Returns true if `str` starts with one of the provided `strings`.
 *
 * @param str
 * @param strings
 * @returns
 *
 * ## Usage
 * ```ts
 * endsWithOneOf('cb', 'a', 'b'); // true
 * endsWithOneOf('cc', 'a', 'b'); // false
 * ```
 */
export function endsWithOneOf(str: string, strings: string[]): boolean {
	for (const s of strings) {
		if (str.endsWith(s)) return true;
	}

	return false;
}

/** Case insensitive equality. Returns true if `left.toLowerCase()` and `right.toLowerCase()` are equal.
 *
 * @param left
 * @param right
 * @returns
 *
 * ## Usage
 * ```ts
 * iEqual('Hello, World!', 'hello, World!'); // true
 * ```
 */
export function iEqual(left: string, right: string): boolean {
	return left.toLowerCase() === right.toLowerCase();
}
