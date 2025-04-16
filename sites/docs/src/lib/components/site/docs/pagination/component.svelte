<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { Props } from './types';
	import { cn } from '$lib/utils';

	let {
		href,
		variant,
		class: className,
		children
	}: Props & { variant: 'next' | 'previous' } = $props();
</script>

<a
	{href}
	class={cn(
		'group flex w-full place-items-center gap-2 rounded-md border border-border px-2 py-3 text-xl font-thin transition-all hover:bg-accent hover:text-accent-foreground',
		{
			'justify-end text-end': variant === 'next',
			'justify-start text-start': variant === 'previous'
		},
		className
	)}
>
	{#if variant === 'next'}
		{@render children()}
		<ChevronRight class="transition-all" />
	{:else}
		<ChevronLeft class="transition-all" />
		{@render children()}
	{/if}
</a>
