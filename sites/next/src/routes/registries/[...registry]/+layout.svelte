<script lang="ts">
	import RegistrySearch from '$lib/components/site/registry-search.svelte';

	let { children } = $props();
</script>

<main class="pt-[--header-height]">
	<div class="border-b py-2">
		<div class="container">
			<RegistrySearch class="max-w-none" />
		</div>
	</div>

	<div class="container">
		{@render children()}
	</div>
</main>
