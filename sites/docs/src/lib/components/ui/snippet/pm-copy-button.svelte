<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import Check from 'lucide-svelte/icons/check';
	import Copy from 'lucide-svelte/icons/copy';
	import { ChevronsUpDown } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { Agent } from 'package-manager-detector';
	import { AGENTS } from 'package-manager-detector/constants';

	type Props = {
		text: string;
		class?: string;
		pm: Agent;
	};

	let { text, class: className, pm = $bindable() }: Props = $props();

	let copied = $state(false);

	const copy = async () => {
		await navigator.clipboard.writeText(text);

		copied = true;

		setTimeout(() => {
			copied = false;
		}, 750);
	};
</script>

<div class={cn('flex place-items-center gap-1', className)}>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					variant="secondary"
					class="h-6 px-2 text-sm text-muted-foreground flex place-items-center gap-1 hover:bg-secondary"
					{...props}
				>
					{pm}
					<ChevronsUpDown class="size-2" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			{#each AGENTS.filter((a) => a !== 'pnpm@6' && a !== 'yarn@berry') as agent}
				<DropdownMenu.Item
					onclick={() => {
						pm = agent;
						copy();
					}}
				>
					{agent}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
	<Button onclick={copy} variant="ghost" size="icon" class="size-6 text-xs">
		<span class="sr-only">Copy</span>
		{#if copied}
			<div in:scale={{ start: 0.85 }}>
				<Check class="size-3" tabindex={-1} />
			</div>
		{:else}
			<div in:scale={{ start: 0.85 }}>
				<Copy class="size-3" tabindex={-1} />
			</div>
		{/if}
	</Button>
</div>
