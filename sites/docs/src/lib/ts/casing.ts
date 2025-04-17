/*
	Installed from github/ieedan/std
*/

import { isLetter } from '$lib/ts/is-letter';

/** Converts a `camelCase` string to a `snake_case` string
 *
 * @param str
 * @returns
 *
 * ## Usage
 * ```ts
 * camelToSnake('helloWorld'); // hello_world
 * ```
 */
export function camelToSnake(str: string): string {
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
}

/** Converts a `PascalCase` string to a `snake_case` string
 *
 * @param str
 * @returns
 *
 * ## Usage
 * ```ts
 * camelToSnake('HelloWorld'); // hello_world
 * ```
 */
export function pascalToSnake(str: string): string {
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
}

/** Converts a `camelCase` string to a `kebab-case` string
 *
 * @param str
 * @returns
 *
 * ## Usage
 * ```ts
 * camelToSnake('helloWorld'); // hello-world
 * ```
 */
export function camelToKebab(str: string): string {
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
}

/** Converts a `PascalCase` string to a `kebab-case` string
 *
 * @param str
 * @returns
 *
 * ## Usage
 * ```ts
 * camelToSnake('HelloWorld'); // hello-world
 * ```
 */
export function pascalToKebab(str: string): string {
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
}

/** Converts a `camelCase` string to a `PascalCase` string (makes first letter lowercase)
 *
 * @param str
 * @returns
 *
 * ## Usage
 * ```ts
 * camelToPascal('helloWorld'); // HelloWorld
 * ```
 */
export function camelToPascal(str: string): string {
	return `${str[0].toLocaleUpperCase()}${str.slice(1)}`;
}

/** Converts a `PascalCase` string to a `camelCase` string (makes first letter uppercase)
 *
 * @param str
 * @returns
 *
 * ## Usage
 * ```ts
 * camelToPascal('HelloWorld'); // helloWorld
 * ```
 */
export function pascalToCamel(str: string): string {
	return `${str[0].toLocaleLowerCase()}${str.slice(1)}`;
}

/** Converts a `snake_case` string to a `PascalCase` string
 *
 *
 * @param str
 * @returns
 *
 * ## Usage
 * ```ts
 * snakeToPascal('hello_world'); // HelloWorld
 * snakeToPascal('HELLO_WORLD'); // HelloWorld
 * ```
 */
export function snakeToPascal(str: string): string {
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
}

/** Converts a `snake_case` string to a `camelCase` string
 *
 *
 * @param str
 * @returns
 *
 * ## Usage
 * ```ts
 * snakeToCamel('hello_world'); // helloWorld
 * snakeToCamel('HELLO_WORLD'); // helloWorld
 * ```
 */
export function snakeToCamel(str: string): string {
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
}

/** Converts a `kebab-case` string to a `PascalCase` string
 *
 * @param str
 * @returns
 *
 * ## Usage
 * ```ts
 * kebabToPascal('hello-world'); // HelloWorld
 * ```
 */
export function kebabToPascal(str: string): string {
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
}

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
				newStr += str[i].toUpperCase();
			}
			continue;
		}

		newStr += str[i].toLocaleLowerCase();
	}

	return newStr;
}
