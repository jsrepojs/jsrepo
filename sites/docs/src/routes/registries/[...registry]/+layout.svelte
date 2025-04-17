<script lang="ts">
	import RegistrySearch from '$lib/components/site/registry-search.svelte';

	let { children } = $props();
</script>

<main class="pt-[--header-height]">
	<div class="fixed top-[--header-height] z-10 h-16 w-full border-b bg-background py-2">
		<div class="container">
			<RegistrySearch class="max-w-none" />
		</div>
	</div>

	<div class="container pt-16">
		{@render children()}
	</div>
</main>
