<script lang="ts">
	import { active } from '$lib/actions/active.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import { ArrowUpRight } from '@lucide/svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	interface Props extends HTMLAnchorAttributes {
		href: string;
		title: string;
		tag?: string;
	}

	let { href, title, tag, class: className, ...rest }: Props = $props();

	const external = $derived(href.startsWith('https://'));
</script>

<div class="flex w-full place-items-center gap-2">
	<a
		{...rest}
		{href}
		target={external ? '_blank' : undefined}
		use:active={{ activeForSubdirectories: false }}
		class={cn(
			'flex place-items-center gap-1 p-0.5 transition-all hover:text-foreground data-[active=true]:text-foreground',
			className
		)}
	>
		{title}
		{#if external}
			<ArrowUpRight class="size-4" />
		{/if}
	</a>
	{#if tag}
		<Badge class="rounded-xl bg-primary px-1 py-0 text-primary-foreground hover:bg-primary">
			{tag}
		</Badge>
	{/if}
</div>
