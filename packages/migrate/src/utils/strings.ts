/** Returns the matched suffix for the string (if it exists). Great for matching string union types.
 *
 * @param str
 * @param strings
 * @returns
 *
 * ## Usage
 * ```ts
 * endsWithOneOf('cb', 'a', 'b'); // 'b'
 * endsWithOneOf('cc', 'a', 'b'); // undefined
 * ```
 */
export function endsWithOneOf<T extends string>(str: string, strings: readonly T[]): T | undefined {
	for (const s of strings) {
		if (str.endsWith(s)) return s;
	}

	return undefined;
}
