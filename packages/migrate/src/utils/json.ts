export function stringify(data: unknown, options: { format?: boolean } = {}): string {
	return JSON.stringify(data, null, options.format ? '\t' : undefined);
}
