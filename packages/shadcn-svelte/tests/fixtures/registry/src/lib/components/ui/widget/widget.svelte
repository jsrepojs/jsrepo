<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { UseCounter } from '$lib/hooks/use-counter.svelte.js';
	import WidgetLabel from './widget-label.svelte';

	let { class: className, children } = $props();

	const counter = new UseCounter();
</script>

<div class={cn('widget', className)}>
	<WidgetLabel>{counter.count}</WidgetLabel>
	{@render children?.()}
</div>
