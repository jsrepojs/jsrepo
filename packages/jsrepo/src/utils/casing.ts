/** Converts a `kebab-case` string to a `camelCase` string
 *
 *
 * @param str
 * @returns
 *
 * ## Usage
 * ```ts
 * kebabToCamel('hello-world'); // helloWorld
 * ```
 */
export function kebabToCamel(str: string): string {
	let newStr = '';

	for (let i = 0; i < str.length; i++) {
		// capitalize first after a -
		if (str[i] === '-') {
			i++;
			if (i <= str.length - 1) {
				newStr += str[i]!.toUpperCase();
			}
			continue;
		}

		newStr += str[i]!.toLocaleLowerCase();
	}

	return newStr;
}
