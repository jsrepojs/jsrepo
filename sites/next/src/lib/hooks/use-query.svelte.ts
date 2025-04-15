export class UseQuery {
	controller: AbortController | undefined = undefined;

	constructor(
		readonly fn: (opts: { signal: AbortSignal; isAborted: (err: unknown) => boolean }) => void
	) {}

	query = $derived.by(() => {
		return async () => {
			this.controller?.abort?.('aborted');
			this.controller = new AbortController();

			this.fn({ signal: this.controller.signal, isAborted: (err) => err === 'aborted' });
		};
	});
}
