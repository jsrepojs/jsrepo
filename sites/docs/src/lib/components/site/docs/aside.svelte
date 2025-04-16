<script lang="ts">
	import { UseToc } from '$lib/hooks/use-toc.svelte.js';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import * as Toc from '$lib/components/ui/toc';

	let { class: className }: { class?: string } = $props();

	const toc = new UseToc();

	onMount(() => {
		toc.ref = document.querySelector('div.prose') ?? undefined;
	});
</script>

<div class={cn('scrollbar-hide flex-col overflow-y-auto bg-background pb-4', className)}>
	{#if toc.current.length > 0}
		<span class="mt-4 font-mono text-xs font-normal uppercase tracking-wider text-muted-foreground">
			On This Page
		</span>
		<Toc.Root toc={toc.current} />
	{/if}
</div>
