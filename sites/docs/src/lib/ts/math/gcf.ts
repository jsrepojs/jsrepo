/*
	jsrepo 1.3.0
	Installed from github/ieedan/std
	11-22-2024
*/

/** Solves the GCF (Greatest Common Factor) using the **Euclidean Algorithm**
 *
 * @param a
 * @param b
 * @returns
 *
 * ## Usage
 * ```ts
 * gcf(1920, 1080); // 120
 * gcf(2, 2); // 2
 * ```
 */
const gcf = (a: number, b: number): number => {
	if (a === 0 || b === 0) throw new Error('Cannot get the GCF of 0');

	// if they are negative we really just want the same thing
	let num1: number = Math.abs(a);
	let num2: number = Math.abs(b);

	while (num1 !== num2) {
		if (num1 > num2) {
			num1 -= num2;
		} else {
			num2 -= num1;
		}
	}

	return num1;
};

/** Solves the GCD (Greatest Common Divisor) using the **Euclidean Algorithm** (Alternate alias of `gcf`)
 *
 * @param a
 * @param b
 * @returns
 *
 * ## Usage
 * ```ts
 * gcd(1920, 1080); // 120
 * gcd(2, 2); // 2
 * ```
 */
const gcd = gcf;

export { gcf, gcd };
