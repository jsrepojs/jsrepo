<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Docs } from '../../../../../.velite/index';

	let {
		title,
		description,
		lastUpdated,
		children
	}: Omit<Docs, 'path'> & { children: Snippet<[]> } = $props();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="docs">
	<h1>{title}</h1>
	<p class="text-lg lg:text-xl text-muted-foreground">{description}</p>
	<span class="font-mono text-xs text-muted-foreground">
        {new Date(lastUpdated).toLocaleDateString()}
    </span>
	{@render children()}
</div>
