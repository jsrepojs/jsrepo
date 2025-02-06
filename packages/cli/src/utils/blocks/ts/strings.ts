/** Returns true if `str` starts with one of the provided `strings`.
 *
 * ## Usage
 * ```ts
 * startsWithOneOf('a', 'a', 'b'); // true
 * startsWithOneOf('c', 'a', 'b'); // false
 * ```
 *
 * @param str
 * @param strings
 * @returns
 */
const startsWithOneOf = (str: string, strings: string[]): boolean => {
	for (const s of strings) {
		if (str.startsWith(s)) return true;
	}

	return false;
};

export { startsWithOneOf };
