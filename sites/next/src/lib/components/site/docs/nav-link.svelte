<script lang="ts">
	import { active } from '$lib/actions/active.svelte';
	import { cn } from '$lib/utils';
	import { ArrowUpRight } from '@lucide/svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	interface Props extends HTMLAnchorAttributes {
		href: string;
		title: string;
	}

	let { href, title, class: className, ...rest }: Props = $props();

	const external = $derived(href.startsWith('https://'))
</script>

<a
	{...rest}
	{href}
	target={external ? '_blank' : undefined}
	use:active={{ activeForSubdirectories: false }}
	class={cn('p-0.5 transition-all hover:text-foreground flex place-items-center gap-1 data-[active=true]:text-foreground')}
>
	{title}
	{#if external}
		<ArrowUpRight class="size-4"/>
	{/if}
</a>
