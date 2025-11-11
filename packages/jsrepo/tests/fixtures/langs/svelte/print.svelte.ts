export function usePrint<T>(value: T) {
	$effect(() => {
		console.log(value);
	});
}
