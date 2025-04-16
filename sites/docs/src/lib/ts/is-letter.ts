/*
	Installed from github/ieedan/std
*/

export const LETTER_REGEX = new RegExp(/[a-zA-Z]/);

/** Checks if the provided character is a letter in the alphabet.
 *
 * @param char
 * @returns
 *
 * ## Usage
 * ```ts
 * isLetter('a');
 * ```
 */
export function isLetter(char: string): boolean {
	if (char.length > 1) {
		throw new Error(
			`You probably only meant to pass a character to this function. Instead you gave ${char}`
		);
	}

	return LETTER_REGEX.test(char);
}
