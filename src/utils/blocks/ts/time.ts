/*
	Installed from @ieedan/std
*/

/** Milliseconds in a second */
export const SECOND = 1000;
/** Milliseconds in a minute */
export const MINUTE = SECOND * 60;
/** Milliseconds in an hour */
export const HOUR = MINUTE * 60;
/** Milliseconds in a day */
export const DAY = HOUR * 24;

/** Formats a time given in milliseconds with units.
 *
 * @param durationMs Time to be formatted in milliseconds
 * @param transform Runs before the num is formatted perfect place to put a `.toFixed()`
 * @returns
 *
 * ## Usage
 * ```ts
 * formatDuration(500); // 500ms
 * formatDuration(SECOND); // 1s
 * formatDuration(MINUTE); // 1min
 * formatDuration(HOUR); // 1h
 * ```
 */
export function formatDuration(
	durationMs: number,
	transform: (num: number) => string = (num) => num.toString()
): string {
	if (durationMs < SECOND) return `${transform(durationMs)}ms`;

	if (durationMs < MINUTE) return `${transform(durationMs / SECOND)}s`;

	if (durationMs < HOUR) return `${transform(durationMs / MINUTE)}min`;

	return `${durationMs / HOUR}h`;
}
