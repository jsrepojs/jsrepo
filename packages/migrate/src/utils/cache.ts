// biome-ignore lint/suspicious/noExplicitAny: it's fine man
export function cachedFn<Fn extends (...args: any[]) => any>(
	fn: Fn,
	{
		cache,
		getCacheKey,
	}: {
		cache: NoInfer<Map<string, ReturnType<Fn>>>;
		getCacheKey: (...args: NoInfer<Parameters<Fn>>) => string;
	},
	...args: NoInfer<Parameters<Fn>>
) {
	const cacheKey = getCacheKey(...args);

	if (cache.has(cacheKey)) return cache.get(cacheKey) as ReturnType<Fn>;

	const result = fn(...args);
	cache.set(cacheKey, result);
	return result;
}
