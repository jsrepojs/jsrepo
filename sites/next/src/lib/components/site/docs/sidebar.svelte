<script lang="ts">
	import { active } from '$lib/actions/active.svelte';
	import { map } from '$lib/docs/map.js';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-col gap-4 overflow-y-auto border-r bg-background pb-4', className)}>
	{#each Object.entries(map) as [title, docs]}
		<div class="mt-4 flex flex-col gap-2">
			<span class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
				{title}
			</span>
			<ul class="flex flex-col font-light text-muted-foreground">
				{#each docs as doc}
					<a
						use:active={{ activeForSubdirectories: false }}
						href={doc.href}
						class="w-full p-0.5 transition-all hover:text-foreground data-[active=true]:text-foreground"
					>
						{doc.title}
					</a>
					{#if doc.children}
						<ul class="flex flex-col pl-4 border-l ml-1">
							{#each doc.children as child}
								<a
									use:active={{ activeForSubdirectories: false }}
									href={child.href}
									class="w-full p-0.5 transition-all hover:text-foreground data-[active=true]:text-foreground"
								>
									{child.title}
								</a>
							{/each}
						</ul>
					{/if}
				{/each}
			</ul>
		</div>
	{/each}
</div>
