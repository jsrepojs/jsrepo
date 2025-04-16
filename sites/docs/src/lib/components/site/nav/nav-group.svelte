<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import NavTitle from './nav-title.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		title?: string;
		class?: string;
	}

	let { title, class: className, children, ...rest }: Props = $props();
</script>

<div {...rest} class={cn('mt-4 flex flex-col gap-2', className)}>
	{#if title}
		<NavTitle>{title}</NavTitle>
	{/if}
	{@render children?.()}
</div>
