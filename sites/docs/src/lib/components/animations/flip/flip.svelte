<script lang="ts">
	import { cn } from '$lib/utils/utils';

	type Props = {
		items: string[];
		index?: number;
		height: number;
		class?: string;
	};

	let { items, index = $bindable(0), height, class: className }: Props = $props();
</script>

<span style="height: {height}px;" class={cn('relative overflow-hidden', className)}>
	<div
		class={cn('flex flex-col transition-all duration-500 ease-in-out')}
		style="transform: translateY(calc(-{100 / items.length}% * {index}));"
	>
		{#each items as item, i (i)}
			<span
				aria-hidden={index !== i}
				style="height: {height}px;"
				class="h-full transition-all duration-500"
			>
				{item}
			</span>
		{/each}
	</div>
</span>
