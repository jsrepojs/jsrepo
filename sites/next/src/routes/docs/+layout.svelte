<script lang="ts">
	import { Aside, Sidebar } from '$lib/components/site/docs';
	import Header from '$lib/components/site/header.svelte';
	import * as Pagination from '$lib/components/site/docs/pagination';
	import { page } from '$app/state';
	import { map, type Doc } from '$lib/docs/map.js';

	let { data, children } = $props();

	const flatMap = $derived(Object.entries(map).flatMap(([_, docs]) => docs));

	const paginated = $derived(getPaginated(flatMap, page.url.pathname));

	function getPaginated(docs: Doc[], pathname: string): { next?: Doc; previous?: Doc } {
		const index = docs.findIndex((d) => d.href === page.url.pathname);

		return {
			previous: docs[index - 1],
			next: docs[index + 1]
		};
	}
</script>

<div class="container" style="--header-height: 64px; --aside-width: 14rem; --sidebar-width: 14rem;">
	<Header stars={data.stars} />

	<Sidebar
		class="fixed top-[--header-height] z-10 hidden h-[calc(100svh-var(--header-height))] w-[--sidebar-width] md:flex"
	/>

	<!-- Pads the content on either side to make room for the sidebar and aside  -->
	<div
		class="relative grid md:grid-cols-[var(--sidebar-width)_1fr] lg:grid-cols-[var(--sidebar-width)_1fr_var(--aside-width)]"
	>
		<div class="col-start-1 hidden md:block"><!-- SPACING ONLY --></div>
		<div class="relative col-start-2 max-w-full overflow-hidden pt-[--header-height]">
			{@render children()}
			<div class="grid grid-cols-2 gap-2 px-8 pb-4">
				{#if paginated.previous}
					{@const { href, title } = paginated.previous}
					<Pagination.Previous {href} class="col-start-1">
						{title}
					</Pagination.Previous>
				{/if}
				{#if paginated.next}
					{@const { href, title } = paginated.next}
					<Pagination.Next {href} class="col-start-2">
						{title}
					</Pagination.Next>
				{/if}
			</div>
		</div>
		<div class="col-start-3 hidden md:block"><!-- SPACING ONLY --></div>
	</div>

	<!-- make sure the TOC updates when we switch pages -->
	{#key page.url.pathname}
		<Aside
			class="fixed right-[2rem] top-[--header-height] z-10 hidden h-[calc(100svh-var(--header-height))] w-[--aside-width] lg:flex"
		/>
	{/key}
</div>
