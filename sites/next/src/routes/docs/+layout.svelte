<script lang="ts">
	import { Sidebar } from '$lib/components/site/docs';
	import Header from '$lib/components/site/header.svelte';
	import { UseToc } from '$lib/hooks/use-toc.svelte.js';
	import * as Toc from '$lib/components/ui/toc';
	import { onMount } from 'svelte';
	import { map } from '$lib/docs/map.js';

	let { children } = $props();

	const toc = new UseToc();

	onMount(() => {
		toc.ref = document.querySelector('div.prose');
	});
</script>

<div class="container" style="--header-height: 64px; --aside-width: 14rem;">
	<header
		class="fixed left-0 top-0 z-10 flex h-[--header-height] w-full items-center border-b bg-background px-[2rem]"
	>
		jsrepo
	</header>
	<div
		class="fixed top-[--header-height] z-10 hidden h-[calc(100svh-var(--header-height))] w-[--aside-width] flex-col border-r bg-background md:flex"
	>
		{#each Object.entries(map) as [title, docs]}
			<div class="mt-4 flex flex-col gap-2">
				<span class="text-xs font-medium uppercase text-muted-foreground">
					{title}
				</span>
				<ul class="flex flex-col font-light text-muted-foreground text-sm">
					{#each docs as doc}
						<a href={doc.href} class="p-0.5 w-full hover:text-foreground transition-all">
							{doc.title}
						</a>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
	<div
		class="relative grid md:grid-cols-[var(--aside-width)_1fr] lg:grid-cols-[var(--aside-width)_1fr_var(--aside-width)]"
	>
		<div class="col-start-1"></div>
		<div class="relative col-start-2 max-w-full overflow-hidden pt-[--header-height]">
			{@render children()}
		</div>
		<div class="col-start-3"></div>
	</div>
	<div
		class="fixed right-[2rem] top-[--header-height] z-10 hidden h-[calc(100svh-var(--header-height))] w-[--aside-width] flex-col bg-background p-2 lg:flex"
	>
		<Toc.Root toc={toc.current} />
	</div>
</div>
