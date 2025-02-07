/** Returns true if `str` starts with one of the provided `strings`.
 *
 * ## Usage
 * ```ts
 * startsWithOneOf('ab', 'a', 'c'); // true
 * startsWithOneOf('cc', 'a', 'b'); // false
 * ```
 *
 * @param str
 * @param strings
 * @returns
 */
export const startsWithOneOf = (str: string, strings: string[]): boolean => {
	for (const s of strings) {
		if (str.startsWith(s)) return true;
	}

	return false;
};

/** Returns true if `str` starts with one of the provided `strings`.
 *
 * ## Usage
 * ```ts
 * endsWithOneOf('cb', 'a', 'b'); // true
 * endsWithOneOf('cc', 'a', 'b'); // false
 * ```
 *
 * @param str
 * @param strings
 * @returns
 */
export const endsWithOneOf = (str: string, strings: string[]): boolean => {
	for (const s of strings) {
		if (str.endsWith(s)) return true;
	}

	return false;
};
