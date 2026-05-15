export type StringifyOptions = {
	format?: StringifyFormat;
};

export type StringifyFormat = boolean | { space: string };

export function stringify(data: unknown, options: StringifyOptions = {}): string {
	let spacer: string | undefined;
	if (options.format === undefined || options.format === true) {
		spacer = '\t';
	} else if (typeof options.format === 'object') {
		spacer = options.format.space;
	}
	return JSON.stringify(data, null, spacer);
}
