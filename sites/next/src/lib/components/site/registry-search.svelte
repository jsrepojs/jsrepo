<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { UseQuery } from '$lib/hooks/use-query.svelte.js';
	import { goto } from '$app/navigation';
	import { activeElement } from 'runed';
	import { debounced } from '$lib/ts/debounced.js';
	import type { RegistryResponse } from '../../../routes/api/registries/types';
	import { cn } from '$lib/utils';
	import { selectProvider } from 'jsrepo';
	import { Plus } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { getIcon } from '$lib/ts/registry/client';

	type Props = {
		class?: string;
		search?: string;
	};

	let { search = $bindable(''), class: className }: Props = $props();

	let searching = $state(false);
	let completions: string[] = $state([]);

	const query = new UseQuery(async ({ signal, isAborted }) => {
		if (search === '') {
			searching = false;
			completions = [];
			return;
		}

		searching = true;

		try {
			const response = await fetch(`/api/registries?limit=3&query=${search}`, {
				signal
			});

			if (!response.ok) return;

			const data = (await response.json()) as RegistryResponse;

			completions = data.registries.map((r) => r.url);

			// searching isn't in a finally block because we still want to show loading for the newer request
			searching = false;
		} catch (err) {
			if (!isAborted(err)) {
				searching = false;
			}
		}
	});

	const debouncedQuery = $derived(debounced(query.query, 100));

	const filteredCompletions = $derived(
		completions.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
	);

	let adding = $state(false);
	let error = $state<string>();

	// rest error on change
	$effect(() => {
		search;

		untrack(() => {
			error = undefined;
		});
	});

	async function addRegistry(url: string) {
		adding = true;

		try {
			const response = await fetch('/api/registries', {
				method: 'POST',
				body: JSON.stringify({ url })
			});

			if (!response.ok) {
				error = `${response.status} ${response.statusText}`;

				return;
			}

			await goto(`/registries/${url}`);
		} catch (err) {
			error = err as string;
		} finally {
			adding = false;
		}
	}
</script>

<Command.Root shouldFilter={false} class={cn('relative w-full max-w-2xl', className)}>
	<Command.Input
		id="search-registries"
		bind:value={search}
		oninput={() => debouncedQuery()}
		onkeydown={(e) => {
			// DO NOT SHIP THIS SHIT
			if (e.key === 'Enter' && search.length > 0) {
				console.log('entered')
				goto(`/registries/search?query=${search}`)
			}
		}}
		class="h-12 rounded-lg border"
		placeholder="Search registries..."
		disabled={adding}
		searching={searching || adding}
	/>
	{#if activeElement?.current?.id === 'search-registries' && search.length > 0}
		<Command.List
			class="absolute left-0 top-[3.25rem] z-10 w-full rounded-lg border border-border bg-popover"
		>
			<Command.Viewport>
				<Command.Group>
					{#each filteredCompletions as url (url)}
						{@const Icon = getIcon(url)}
						<Command.Item onSelect={() => goto(`/registries/${url}`)}>
							<Icon/>
							{url}
						</Command.Item>
					{/each}
					{#if filteredCompletions.length === 0 && !searching && search.length > 0}
						{#if selectProvider(search) !== undefined}
							<Command.Item onSelect={() => addRegistry(search)}>
								<Plus />
								Add {search}
							</Command.Item>
						{/if}
					{/if}
				</Command.Group>
			</Command.Viewport>
		</Command.List>
	{/if}
</Command.Root>
