/*
	jsrepo 1.39.3
	Installed from github/ieedan/std
	2-22-2025
*/

export const LETTER_REGEX = new RegExp(/[a-zA-Z]/);

/** Checks if the provided character is a letter in the alphabet.
 *
 * ## Usage
 * ```ts
 * isLetter('a');
 * ```
 * @param char
 * @returns
 */
export const isLetter = (char: string) => {
	if (char.length > 1) {
		throw new Error(
			`You probably only meant to pass a character to this function. Instead you gave ${char}`
		);
	}

	return LETTER_REGEX.test(char);
};
