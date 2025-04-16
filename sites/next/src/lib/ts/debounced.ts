// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounced(fn: (...args: any[]) => void, ms: number) {
	let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (...args: any[]) => {
		if (timeout !== undefined) clearTimeout(timeout);

		timeout = setTimeout(() => fn(args), ms);
	};
}
