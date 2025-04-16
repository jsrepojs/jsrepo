<script lang="ts">
	import { Aside, Sidebar } from '$lib/components/site/docs';
	import * as Pagination from '$lib/components/site/docs/pagination';
	import { page } from '$app/state';
	import { map, type Doc } from '$lib/docs/map.js';

	let { children } = $props();

	const flatMap = $derived(flattenDocsMap(Object.entries(map).flatMap(([_, d]) => d)));

	const paginated = $derived(getPaginated(flatMap, page.url.pathname));

	function flattenDocsMap(map: Doc[]): Doc[] {
		return map.flatMap((doc) => [doc, ...flattenDocsMap(doc.children ?? [])]);
	}

	function getPaginated(docs: Doc[], pathname: string): { next?: Doc; previous?: Doc } {
		const index = docs.findIndex((d) => d.href === pathname);

		const next = docs[index + 1];
		const nextIsExternal = next.href.startsWith('https://');

		return {
			previous: docs[index - 1],
			// don't show external links in pagination
			next: nextIsExternal ? undefined : next
		};
	}
</script>

<div
	class="container relative grid grid-cols-1 md:grid-cols-[var(--sidebar-width)_1fr] lg:grid-cols-[var(--sidebar-width)_1fr_var(--aside-width)]"
>
	<div class="col-start-1 hidden md:block" data-sidebar-section>
		<Sidebar
			class="sticky top-[--header-height] z-10 flex h-[calc(100svh-var(--header-height))] w-[--sidebar-width]"
		/>
	</div>
	<div
		class="relative col-start-1 min-h-svh max-w-full overflow-hidden pt-[--header-height] md:col-start-2"
	>
		{@render children()}
		<div class="grid grid-cols-2 gap-2 pb-4 md:px-8">
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
	<div class="col-start-3 hidden lg:block" data-aside-section>
		<!-- make sure the TOC updates when we switch pages -->
		{#key page.url.pathname}
			<Aside
				class="sticky top-[--header-height] z-10 flex h-[calc(100svh-var(--header-height))] w-[--aside-width]"
			/>
		{/key}
	</div>
</div>
