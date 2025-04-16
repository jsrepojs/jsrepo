<script lang="ts">
	import Component from './component.svelte';
	import type { Props } from './types';

	let { ...props }: Props = $props();
</script>

<Component variant="next" {...props} />
