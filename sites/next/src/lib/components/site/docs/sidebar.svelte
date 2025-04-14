<script lang="ts">
	import { map } from '$lib/docs/map.js';
	import { cn } from '$lib/utils';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { ChevronDown } from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Nav from '$lib/components/site/nav';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-col gap-4 overflow-y-auto border-r bg-background pb-4', className)}>
	{#each Object.entries(map) as [title, docs] (title)}
		<Nav.Group {title}>
			<Nav.List>
				{#each docs as doc (doc.title)}
					{#if doc.children}
						<Collapsible.Root class="group" open={true}>
							<div class="flex place-items-center justify-between pr-2">
								<Nav.Link title={doc.title} href={doc.href} tag={doc.tag} />
								<Collapsible.Trigger
									class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-6')}
								>
									<ChevronDown class="group-data-[state=open]:rotate-180" />
								</Collapsible.Trigger>
							</div>
							<Collapsible.Content>
								<Nav.List class="ml-1 flex flex-col border-l pl-4">
									{#each doc.children as child (child.title)}
										<Nav.Link title={child.title} href={child.href} tag={child.tag} />
									{/each}
								</Nav.List>
							</Collapsible.Content>
						</Collapsible.Root>
					{:else}
						<Nav.Link title={doc.title} href={doc.href} tag={doc.tag} />
					{/if}
				{/each}
			</Nav.List>
		</Nav.Group>
	{/each}
</div>
