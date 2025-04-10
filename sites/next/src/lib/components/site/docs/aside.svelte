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

<div class={cn('flex-col bg-background pb-4', className)}>
	<span class="font-mono text-xs uppercase tracking-wider mt-4">On This Page</span>
	<Toc.Root toc={toc.current} />
</div>
