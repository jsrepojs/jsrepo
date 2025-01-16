/*
	jsrepo 1.26.4
	Installed from github/ieedan/std
	1-16-2025
*/

/** Joins the segments into a single url correctly handling leading and trailing slashes in each segment.
 *
 * ## Usage
 * ```ts
 * const url = join('https://example.com', '', 'api/', '/examples/');
 *
 * console.log(url); // https://example.com/api/examples
 * ```
 *
 * @param segments
 * @returns
 */
const join = (...segments: string[]) => {
	return segments
		.map((s) => removeLeadingAndTrailingSlash(s))
		.filter(Boolean)
		.join('/');
};

/** Removes the leading and trailing slash from the segment (if they exist)
 * ## Usage
 * ```ts
 * const segment = removeLeadingAndTrailingSlash('/example/');
 *
 * console.log(segment); // 'example'
 * ```
 *
 * @param segment
 * @returns
 */
const removeLeadingAndTrailingSlash = (segment: string) => {
	const newSegment = removeLeadingSlash(segment);
	return removeTrailingSlash(newSegment);
};

/** Adds a leading and trailing to the beginning and end of the segment (if it doesn't already exist)
 *
 * ## Usage
 * ```ts
 * const segment = addLeadingAndTrailingSlash('example');
 *
 * console.log(segment); // '/example/'
 * ```
 *
 * @param segment
 * @returns
 */
const addLeadingAndTrailingSlash = (segment: string) => {
	// this is a weird case so feel free to handle it however you think it makes the most sense
	if (segment === '') return '//';

	const newSegment = addLeadingSlash(segment);
	return addTrailingSlash(newSegment);
};

/** Removes the leading slash from the beginning of the segment (if it exists)
 *
 * ## Usage
 * ```ts
 * const segment = removeLeadingSlash('/example');
 *
 * console.log(segment); // 'example'
 * ```
 *
 * @param segment
 * @returns
 */
const removeLeadingSlash = (segment: string): string => {
	let newSegment = segment;
	if (newSegment.startsWith('/')) {
		newSegment = newSegment.slice(1);
	}

	return newSegment;
};

/** Adds a leading slash to the beginning of the segment (if it doesn't already exist)
 *
 * ## Usage
 * ```ts
 * const segment = addLeadingSlash('example');
 *
 * console.log(segment); // '/example'
 * ```
 *
 * @param segment
 * @returns
 */
const addLeadingSlash = (segment: string): string => {
	let newSegment = segment;
	if (!newSegment.startsWith('/')) {
		newSegment = `/${newSegment}`;
	}

	return newSegment;
};

/** Removes the trailing slash from the end of the segment (if it exists)
 *
 * ## Usage
 * ```ts
 * const segment = removeTrailingSlash('example/');
 *
 * console.log(segment); // 'example'
 * ```
 * @param segment
 * @returns
 */
const removeTrailingSlash = (segment: string): string => {
	let newSegment = segment;
	if (newSegment.endsWith('/')) {
		newSegment = newSegment.slice(0, newSegment.length - 1);
	}

	return newSegment;
};

/** Adds a trailing slash to the end of the segment (if it doesn't already exist)
 *
 * ## Usage
 * ```ts
 * const segment = addTrailingSlash('example');
 *
 * console.log(segment); // 'example/'
 * ```
 *
 * @param segment
 * @returns
 */
const addTrailingSlash = (segment: string): string => {
	let newSegment = segment;
	if (!newSegment.endsWith('/')) {
		newSegment = `${newSegment}/`;
	}

	return newSegment;
};

export {
	join,
	removeLeadingSlash,
	removeTrailingSlash,
	addTrailingSlash,
	addLeadingSlash,
	addLeadingAndTrailingSlash,
	removeLeadingAndTrailingSlash,
};
