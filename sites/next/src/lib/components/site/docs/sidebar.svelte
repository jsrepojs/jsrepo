<script lang="ts">
	import { active } from '$lib/actions/active.svelte';
	import { map } from '$lib/docs/map.js';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-col border-r bg-background', className)}>
	{#each Object.entries(map) as [title, docs]}
		<div class="mt-4 flex flex-col gap-2">
			<span class="text-xs font-medium uppercase text-muted-foreground">
				{title}
			</span>
			<ul class="flex flex-col text-sm font-light text-muted-foreground">
				{#each docs as doc}
					<a
						use:active={{ activeForSubdirectories: false }}
						href={doc.href}
						class="w-full p-0.5 transition-all hover:text-foreground data-[active=true]:text-foreground"
					>
						{doc.title}
					</a>
				{/each}
			</ul>
		</div>
	{/each}
</div>
