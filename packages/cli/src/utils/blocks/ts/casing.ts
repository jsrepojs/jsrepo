/*
	jsrepo 1.39.3
	Installed from github/ieedan/std
	2-22-2025
*/

import { isLetter } from './is-letter';

/** Converts a `camelCase` string to a `snake_case` string
 *
 * ## Usage
 * ```ts
 * camelToSnake('helloWorld'); // hello_world
 * ```
 *
 * @param str
 * @returns
 */
export const camelToSnake = (str: string) => {
	let newStr = '';

	for (let i = 0; i < str.length; i++) {
		// is uppercase letter
		if (isLetter(str[i]) && str[i].toUpperCase() === str[i]) {
			let l = i;

			while (l < str.length && isLetter(str[l]) && str[l].toUpperCase() === str[l]) {
				l++;
			}

			newStr += `${str.slice(i, l - 1).toLocaleLowerCase()}_${str[l - 1].toLocaleLowerCase()}`;

			i = l - 1;

			continue;
		}

		newStr += str[i].toLocaleLowerCase();
	}

	return newStr;
};

/** Converts a `PascalCase` string to a `snake_case` string
 *
 * ## Usage
 * ```ts
 * camelToSnake('HelloWorld'); // hello_world
 * ```
 *
 * @param str
 * @returns
 */
export const pascalToSnake = (str: string) => {
	let newStr = '';

	let firstLetter: number | undefined;

	for (let i = 0; i < str.length; i++) {
		if (firstLetter === undefined && isLetter(str[i])) {
			firstLetter = i;
		}

		// is uppercase letter (ignoring the first)
		if (
			firstLetter !== undefined &&
			i > firstLetter &&
			isLetter(str[i]) &&
			str[i].toUpperCase() === str[i]
		) {
			let l = i;

			while (l < str.length && isLetter(str[l]) && str[l].toUpperCase() === str[l]) {
				l++;
			}

			newStr += `${str.slice(i, l - 1).toLocaleLowerCase()}_${str[l - 1].toLocaleLowerCase()}`;

			i = l - 1;

			continue;
		}

		newStr += str[i].toLocaleLowerCase();
	}

	return newStr;
};

/** Converts a `camelCase` string to a `kebab-case` string
 *
 * ## Usage
 * ```ts
 * camelToSnake('helloWorld'); // hello-world
 * ```
 *
 * @param str
 * @returns
 */
export const camelToKebab = (str: string) => {
	let newStr = '';

	for (let i = 0; i < str.length; i++) {
		// is uppercase letter
		if (i > 0 && isLetter(str[i]) && str[i].toUpperCase() === str[i]) {
			let l = i;

			while (l < str.length && isLetter(str[l]) && str[l].toUpperCase() === str[l]) {
				l++;
			}

			newStr += `${str.slice(i, l - 1).toLocaleLowerCase()}-${str[l - 1].toLocaleLowerCase()}`;

			i = l - 1;

			continue;
		}

		newStr += str[i].toLocaleLowerCase();
	}

	return newStr;
};

/** Converts a `PascalCase` string to a `kebab-case` string
 *
 * ## Usage
 * ```ts
 * camelToSnake('HelloWorld'); // hello-world
 * ```
 *
 * @param str
 * @returns
 */
export const pascalToKebab = (str: string) => {
	let newStr = '';

	for (let i = 0; i < str.length; i++) {
		// is uppercase letter (ignoring the first)
		if (i > 0 && isLetter(str[i]) && str[i].toUpperCase() === str[i]) {
			let l = i;

			while (l < str.length && isLetter(str[l]) && str[l].toUpperCase() === str[l]) {
				l++;
			}

			newStr += `${str.slice(i, l - 1).toLocaleLowerCase()}-${str[l - 1].toLocaleLowerCase()}`;

			i = l - 1;

			continue;
		}

		newStr += str[i].toLocaleLowerCase();
	}

	return newStr;
};

/** Converts a `camelCase` string to a `PascalCase` string (makes first letter lowercase)
 *
 * ## Usage
 * ```ts
 * camelToPascal('helloWorld'); // HelloWorld
 * ```
 * @param str
 * @returns
 */
export const camelToPascal = (str: string) => {
	return `${str[0].toLocaleUpperCase()}${str.slice(1)}`;
};

/** Converts a `PascalCase` string to a `camelCase` string (makes first letter uppercase)
 *
 * ## Usage
 * ```ts
 * camelToPascal('HelloWorld'); // helloWorld
 * ```
 * @param str
 * @returns
 */
export const pascalToCamel = (str: string) => {
	return `${str[0].toLocaleLowerCase()}${str.slice(1)}`;
};

/** Converts a `snake_case` string to a `PascalCase` string
 *
 * ## Usage
 * ```ts
 * snakeToPascal('hello_world'); // HelloWorld
 * snakeToPascal('HELLO_WORLD'); // HelloWorld
 * ```
 *
 * @param str
 * @returns
 */
export const snakeToPascal = (str: string) => {
	let newStr = '';

	let firstLetter = true;

	for (let i = 0; i < str.length; i++) {
		// capitalize first letter
		if (firstLetter && isLetter(str[i])) {
			firstLetter = false;
			newStr += str[i].toUpperCase();
			continue;
		}

		// capitalize first after a _ (ignoring the first)
		if (!firstLetter && str[i] === '_') {
			i++;
			if (i <= str.length - 1) {
				newStr += str[i].toUpperCase();
			} else {
				newStr += '_';
			}
			continue;
		}

		newStr += str[i].toLocaleLowerCase();
	}

	return newStr;
};

/** Converts a `snake_case` string to a `camelCase` string
 *
 * ## Usage
 * ```ts
 * snakeToCamel('hello_world'); // helloWorld
 * snakeToCamel('HELLO_WORLD'); // helloWorld
 * ```
 *
 * @param str
 * @returns
 */
export const snakeToCamel = (str: string) => {
	let newStr = '';

	let firstLetter = true;

	for (let i = 0; i < str.length; i++) {
		// capitalize first letter
		if (firstLetter && isLetter(str[i])) {
			firstLetter = false;
			newStr += str[i].toLowerCase();
			continue;
		}

		// capitalize first after a _ (ignoring the first)
		if (!firstLetter && str[i] === '_') {
			i++;
			if (i <= str.length - 1) {
				newStr += str[i].toUpperCase();
			} else {
				newStr += '_';
			}
			continue;
		}

		newStr += str[i].toLocaleLowerCase();
	}

	return newStr;
};

/** Converts a `kebab-case` string to a `PascalCase` string
 *
 * ## Usage
 * ```ts
 * kebabToPascal('hello-world'); // HelloWorld
 * ```
 *
 * @param str
 * @returns
 */
export const kebabToPascal = (str: string) => {
	let newStr = '';

	for (let i = 0; i < str.length; i++) {
		// capitalize first
		if (i === 0) {
			newStr += str[i].toUpperCase();
			continue;
		}

		// capitalize first after a -
		if (str[i] === '-') {
			i++;
			if (i <= str.length - 1) {
				newStr += str[i].toUpperCase();
			}
			continue;
		}

		newStr += str[i].toLocaleLowerCase();
	}

	return newStr;
};

/** Converts a `kebab-case` string to a `camelCase` string
 *
 * ## Usage
 * ```ts
 * kebabToCamel('hello-world'); // helloWorld
 * ```
 *
 * @param str
 * @returns
 */
export const kebabToCamel = (str: string) => {
	let newStr = '';

	for (let i = 0; i < str.length; i++) {
		// capitalize first after a -
		if (str[i] === '-') {
			i++;
			if (i <= str.length - 1) {
				newStr += str[i].toUpperCase();
			}
			continue;
		}

		newStr += str[i].toLocaleLowerCase();
	}

	return newStr;
};
