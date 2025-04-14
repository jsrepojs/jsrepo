export function useQuery(fn: (opts: { signal: AbortSignal, isAborted: (err: unknown) => boolean }) => void) {
	let controller: AbortController;

	const query = $derived.by(() => {
		return async () => {
			controller?.abort?.('aborted');
			controller = new AbortController();

			fn({ signal: controller.signal, isAborted: (err) => err === "aborted" });
		};
	});

	return {
		query
	};
}
