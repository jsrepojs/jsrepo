<script lang="ts">
	import { page } from '$app/state';
	import { map } from '$lib/docs/map';
	import NavLink from './nav-link.svelte';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import * as Icons from '$lib/components/icons';

	type Props = {
		open?: boolean;
	};

	let { open = $bindable(false) }: Props = $props();
</script>

<div
	class={cn(
		'container fixed left-0 top-[--header-height] z-50 hidden h-[calc(100svh-var(--header-height))] w-full flex-col gap-4 bg-background',
		{ 'flex md:hidden': open }
	)}
>
	{#if page.url.pathname.startsWith('/docs')}
		<div class="flex flex-col gap-4">
			{#each Object.entries(map) as [title, docs]}
				<div class="mt-4 flex flex-col gap-2">
					<span class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
						{title}
					</span>
					<ul class="flex flex-col font-light text-muted-foreground">
						{#each docs as doc}
							{@render navLink(doc)}
							{#if doc.children}
								<ul class="ml-1 flex flex-col border-l pl-4">
									{#each doc.children as child}
										{@render navLink(child)}
									{/each}
								</ul>
							{/if}
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{/if}
	<div class="flex place-items-center gap-2">
		<LightSwitch class="size-9" />
		<Button
			target="_blank"
			href="https://github.com/ieedan/jsrepo"
			variant="outline"
			class="size-9 px-2"
		>
			<span class="sr-only">GitHub</span>
			<Icons.GitHub />
		</Button>
	</div>
</div>

{#snippet navLink({ href, title, tag }: { href: string; title: string; tag?: string })}
	<div class="flex w-full place-items-center gap-2">
		<NavLink {href} {title} onclick={() => (open = false)} />
		{#if tag}
			<Badge class="rounded-xl bg-brand px-1 py-0 text-brand-foreground hover:bg-brand">{tag}</Badge
			>
		{/if}
	</div>
{/snippet}
