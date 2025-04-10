<script lang="ts">
	import { type PrimitiveAnchorAttributes, cn } from "$lib/utils.js";

	let { class: className, children, href, ...restProps }: PrimitiveAnchorAttributes = $props();

	const internal = $derived(href?.startsWith("/") || href?.startsWith("#"));
	const rel = $derived(!internal ? "noopener noreferrer" : undefined);
	const target = $derived(!internal ? "_blank" : undefined);
</script>

<a
	{href}
	{target}
	{rel}
	class={cn(className)}
	{...restProps}
>
	{@render children?.()}
</a>
