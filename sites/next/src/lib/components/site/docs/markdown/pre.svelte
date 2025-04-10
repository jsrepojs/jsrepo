<script lang="ts">
	import { onMount } from "svelte";
	import { CopyButton } from "$lib/components/ui/copy-button";
	import { type PrimitiveElementAttributes, cn } from "$lib/utils.js";

	let { class: className, children, ...restProps }: PrimitiveElementAttributes = $props();

	let preNode = $state<HTMLPreElement>();
	let code = $state("");

	onMount(() => {
		if (preNode) {
			code = preNode.innerText.trim().replaceAll("  ", " ");
		}
	});
</script>

<pre
	bind:this={preNode}
	class={cn(
		"mb-4 mt-6 max-h-[650px] overflow-auto rounded-lg border py-4 bg-background",
		className
	)}
	{...restProps}>
	{@render children?.()}
</pre>
<CopyButton text={code} class={cn("absolute right-2 top-8 size-8")} />
