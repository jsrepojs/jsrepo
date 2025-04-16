<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Docs } from '$content/index';

	type Props = Docs & { children: Snippet<[]> };

	let { title, description, children }: Props = $props();
</script>

<svelte:head>
	<title>jsrepo - {title}</title>
	<meta name="description" content={description} />
</svelte:head>

<div class="py-6 md:px-8">
	<h1 class="text-4xl font-bold">{title}</h1>
	<p class="mb-4 text-lg text-muted-foreground">{description}</p>
	<div class="prose flex max-w-full flex-col">
		{@render children()}
	</div>
</div>
