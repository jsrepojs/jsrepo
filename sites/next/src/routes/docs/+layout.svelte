<script lang="ts">
	import { Aside, Sidebar } from '$lib/components/site/docs';
	import Header from '$lib/components/site/header.svelte';

	let { data, children } = $props();
</script>

<div class="container" style="--header-height: 64px; --aside-width: 14rem; --sidebar-width: 14rem;">
	<Header stars={data.stars}/>

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
		</div>
		<div class="col-start-3 hidden md:block"><!-- SPACING ONLY --></div>
	</div>

	<Aside
		class="fixed right-[2rem] top-[--header-height] z-10 hidden h-[calc(100svh-var(--header-height))] w-[--aside-width] lg:flex"
	/>
</div>
