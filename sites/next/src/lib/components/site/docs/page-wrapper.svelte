<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Docs } from '../../../../../.velite/index';
	import { UseToc } from '$lib/hooks/use-toc.svelte.js'

	let {
		title,
		description,
		children
	}: Omit<Docs, 'path'> & { children: Snippet<[]> } = $props();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="py-4 md:px-4">
	<h1 class="text-4xl font-bold">{title}</h1>
	<p class="mb-6 text-lg text-muted-foreground">{description}</p>
	<div class="prose flex max-w-full flex-col">
		{@render children()}
	</div>
</div>
