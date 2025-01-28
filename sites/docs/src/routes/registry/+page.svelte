<script lang="ts">
	import Registry from './registry.svelte';

	let { data } = $props();
</script>

<Registry {...data} />
