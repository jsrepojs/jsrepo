/*
	Installed from @ieedan/std
*/

/** Returns the string that matches the string (if it exits). Great for matching string union types.
 *
 * @param str
 * @param strings
 * @returns
 *
 * ## Usage
 * ```ts
 * const methods = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'] as const;
 *
 * const methodStr: string = 'GET';
 *
 * const method = equalsOneOf(methodStr, methods);
 *
 * if (method) {
 *  // if method was just a string this would be a type error
 * 	methods.includes(method)
 * }
 * ```
 */
export function equalsOneOf<T extends string>(str: string, strings: readonly T[]): T | undefined {
	for (const s of strings) {
		if (s === str) return s;
	}

	return undefined;
}

/** Returns the matched prefix for the string (if it exists). Great for matching string union types.
 *
 * @param str
 * @param strings
 * @returns
 *
 * ## Usage
 * ```ts
 * startsWithOneOf('ab', 'a', 'c'); // 'a'
 * startsWithOneOf('cc', 'a', 'b'); // undefined
 * ```
 */
export function startsWithOneOf<T extends string>(
	str: string,
	strings: readonly T[]
): T | undefined {
	for (const s of strings) {
		if (str.startsWith(s)) return s;
	}

	return undefined;
}

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
