<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { class: className, children } = $props();
</script>

<span class={cn('widget-label', className)}>{@render children?.()}</span>
