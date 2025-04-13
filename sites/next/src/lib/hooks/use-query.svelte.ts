export function useQuery(fn: (opts: { signal: AbortSignal }) => void) {
	let controller: AbortController;

	const query = $derived.by(() => {
		return async () => {
			controller?.abort?.();
			controller = new AbortController();

			fn({ signal: controller.signal });
		};
	});

	return {
		query
	};
}
