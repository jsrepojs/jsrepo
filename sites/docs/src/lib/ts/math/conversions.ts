/*
	jsrepo 1.3.0
	Installed from github/ieedan/std
	11-22-2024
*/

/** Converts degrees to radians
 *
 * @param degrees
 * @returns
 *
 * ## Usage
 * ```ts
 * dtr(180); // 3.14159268358979
 * ```
 */
const dtr = (degrees: number): number => degrees * (Math.PI / 180);

/** Converts radians to degrees
 *
 * @param radians
 * @returns
 *
 * ## Usage
 * ```ts
 * rtd(Math.PI); // 180
 * ```
 */
const rtd = (radians: number): number => radians * (180 / Math.PI);

export { dtr, rtd };
