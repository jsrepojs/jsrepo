<script lang="ts">
	import { onMount } from 'svelte';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import { type PrimitiveElementAttributes, cn } from '$lib/utils.js';

	let { class: className, children, ...restProps }: PrimitiveElementAttributes = $props();

	let preNode = $state<HTMLPreElement>();
	let code = $state('');

	onMount(() => {
		if (preNode) {
			code = preNode.innerText.trim().replaceAll('  ', ' ');
		}
	});
</script>

<pre bind:this={preNode} class={cn('', className)} {...restProps}>
	{@render children?.()}
</pre>
<CopyButton text={code} class={cn('absolute right-3 top-3 size-8')} />
