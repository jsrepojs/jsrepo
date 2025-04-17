<!--
	Installed from github/ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import type { Heading } from '$lib/hooks/use-toc.svelte';
	import { cn } from '$lib/utils/utils';
	import Self from './toc.svelte';

	type Props = {
		toc: Heading[];
		class?: string;
		/** Indicates whether this is a child component or root component */
		isChild?: boolean;
	};

	let { toc, isChild = false, class: className }: Props = $props();
</script>

<ul class={cn('m-0 list-none text-sm font-light', { 'pl-4': isChild })}>
	{#each toc as heading, i (i)}
		<li
			class={cn('mt-0 pt-2 text-muted-foreground transition-all', {
				'text-foreground': heading.active
			})}
		>
			{#if heading.id}
				<a href="#{heading.id}" class="hover:text-foreground">
					{heading.label}
				</a>
			{:else}
				{heading.label}
			{/if}
		</li>
		{#if heading.children.length > 0}
			<Self class={className} toc={heading.children} isChild={true} />
		{/if}
	{/each}
</ul>
