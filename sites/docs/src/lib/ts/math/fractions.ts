/*
	Installed from github/ieedan/std
*/

import { gcf } from './gcf';

/** Simplifies the fraction
 *
 * @param numerator
 * @param denominator
 * @returns
 *
 * ## Usage
 * ```ts
 * simplify(1920, 1080).join(":"); // 16:9
 * ```
 */
const simplify = (numerator: number, denominator: number): [number, number] => {
	const factor = gcf(numerator, denominator);

	return [numerator / factor, denominator / factor];
};

export { simplify };
