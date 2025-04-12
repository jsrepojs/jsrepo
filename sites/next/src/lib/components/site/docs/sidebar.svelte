<script lang="ts">
	import { map } from '$lib/docs/map.js';
	import { cn } from '$lib/utils';
	import NavLink from './nav-link.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { ChevronDown } from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import SectionLabel from '../section-label.svelte';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-col gap-4 overflow-y-auto border-r bg-background pb-4', className)}>
	{#each Object.entries(map) as [title, docs] (title)}
		<div class="mt-4 flex flex-col gap-2">
			<SectionLabel>
				{title}
			</SectionLabel>
			<ul class="flex flex-col font-light text-muted-foreground">
				{#each docs as doc (doc.title)}
					{#if doc.children}
						<Collapsible.Root class="group" open={true}>
							<div class="flex place-items-center justify-between pr-2">
								{@render navLink(doc)}
								<Collapsible.Trigger
									class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-6')}
								>
									<ChevronDown class="group-data-[state=open]:rotate-180" />
								</Collapsible.Trigger>
							</div>
							<Collapsible.Content>
								<ul class="ml-1 flex flex-col border-l pl-4">
									{#each doc.children as child (child.title)}
										{@render navLink(child)}
									{/each}
								</ul>
							</Collapsible.Content>
						</Collapsible.Root>
					{:else}
						{@render navLink(doc)}
					{/if}
				{/each}
			</ul>
		</div>
	{/each}
</div>

{#snippet navLink({ href, title, tag }: { href: string; title: string; tag?: string })}
	<div class="flex w-full place-items-center gap-2">
		<NavLink {href} {title} />
		{#if tag}
			<Badge class="rounded-xl bg-brand px-1 py-0 text-brand-foreground hover:bg-brand">{tag}</Badge
			>
		{/if}
	</div>
{/snippet}
