<script lang="ts">
	import Registry from './registry.svelte';

	let { data } = $props();
</script>

<div class="min-h-svh flex flex-col place-items-center py-2 w-full px-4">
	<Registry {...data} />
</div>
