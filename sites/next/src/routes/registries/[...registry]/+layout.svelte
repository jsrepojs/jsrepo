<script lang="ts">
	import RegistrySearch from '$lib/components/site/registry-search.svelte';

	let { children } = $props();
</script>

<main class="pt-[--header-height]">
	<div class="border-b py-2 fixed w-full bg-background h-16 z-10">
		<div class="container">
			<RegistrySearch class="max-w-none" />
		</div>
	</div>

	<div class="container pt-16">
		{@render children()}
	</div>
</main>
