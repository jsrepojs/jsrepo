export function parseMapArgs(val: string, previous: Record<string, string> = {}) {
	const [category, ...pathParts] = val.split(':');

	if (!category || pathParts.length === 0) {
		throw new Error('Each --paths entry must be in the form <category>:<path>');
	}

	// In case the path itself contains ':'
	const path = pathParts.join(':');

	return { ...previous, [category]: path };
}
