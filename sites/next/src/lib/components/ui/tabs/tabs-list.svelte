<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
	bind:ref
	class={cn(
		'scrollbar-hide inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground',
		className
	)}
	{...restProps}
/>
