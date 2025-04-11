<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Docs } from '$content/index';

	type Props = Omit<Docs, 'path'> & { children: Snippet<[]> };

	let { title, description, children }: Props = $props();
</script>

<svelte:head>
	<title>jsrepo ~ {title}</title>
</svelte:head>

<div class="py-6 md:px-8">
	<h1 class="text-4xl font-bold">{title}</h1>
	<p class="mb-6 text-lg text-muted-foreground">{description}</p>
	<div class="prose flex max-w-full flex-col">
		{@render children()}
	</div>
</div>
