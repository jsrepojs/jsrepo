<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { onMount } from 'svelte';
	import { createIndex, searchIndex, type IndexEntry } from './search';
	import { goto } from '$app/navigation';
	import { commandContext } from '$lib/context';

	let search = $state('');
	let openState = commandContext.get();

	const results = $derived(searchIndex(search));

	onMount(async () => {
		const response = await fetch('/search.json');

		if (!response.ok) return;

		const index = (await response.json()) as { docs: IndexEntry[] };

		createIndex(index);
	});
</script>

<Command.Dialog bind:open={openState.current} shouldFilter={false} hideClose>
	<Command.Input
		bind:value={search}
		placeholder="Search documentation..."
		class={{ 'border-b-transparent': results.length === 0 }}
	/>
	{#if results.length > 0}
		<Command.List>
			<Command.Group>
				{#each results as result (result.id)}
					<Command.Item
						onSelect={async () => {
							await goto(result.href);
							openState.setFalse();
							search = '';
						}}
					>
						{result.title}
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.List>
	{/if}
</Command.Dialog>
