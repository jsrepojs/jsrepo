<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { useQuery } from '$lib/hooks/use-query.svelte.js';
	import { goto } from '$app/navigation';
	import { activeElement } from 'runed';
	import { debounced } from '$lib/ts/debounced.js';
	import type { RegistryResponse } from '../../../routes/api/registries/types';
	import { cn } from '$lib/utils';

    type Props = {
        class?: string;
    }

    let { class: className }: Props = $props()

	let search = $state('');
	let searching = $state(false);
	let completions: string[] = $state([]);

	const { query } = useQuery(async ({ signal, isAborted }) => {
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

	const debouncedQuery = $derived(debounced(query, 100));

	const filteredCompletions = $derived(
		completions.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
	);
</script>

<Command.Root shouldFilter={false} class={cn("relative w-full max-w-2xl", className)}>
    <Command.Input
        id="search-registries"
        bind:value={search}
        oninput={() => debouncedQuery()}
        class="h-12 rounded-lg border"
        placeholder="Search registries..."
        {searching}
    />
    {#if activeElement?.current?.id === 'search-registries' && filteredCompletions.length > 0}
        <Command.List
            class="absolute left-0 top-[3.25rem] z-10 w-full rounded-lg border border-border bg-popover"
        >
            <Command.Viewport>
                <Command.Group>
                    {#each filteredCompletions as url (url)}
                        <Command.Item onSelect={() => goto(`/registries/${url}`)}>
                            {url}
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.Viewport>
        </Command.List>
    {/if}
</Command.Root>