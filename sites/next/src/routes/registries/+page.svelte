<script lang="ts">
	import * as Nav from '$lib/components/site/nav';
	import * as Command from '$lib/components/ui/command';
	import { getIcon } from '$lib/ts/registry/client.js';
	import type { RegistryResponse } from '../api/registries/types.js';
	import { useQuery } from '$lib/hooks/use-query.svelte.js';
	import { goto } from '$app/navigation';
	import { activeElement } from 'runed';
	import { debounced } from '$lib/ts/debounced.js';

	let { data } = $props();

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

<svelte:head>
	<title>jsrepo ~ Registries</title>
	<meta name="description" content="Discover and search jsrepo registries" />
</svelte:head>

{#snippet registryIcon({ url }: { url: string })}
	{@const Icon = getIcon(url)}
	<Icon class="size-5 shrink-0" />
{/snippet}

<main class="relative pt-[--header-height]">
	<div class="mt-[25vh] flex flex-col place-items-center">
		<h1 class="py-8 text-5xl font-bold sm:text-7xl">Registries</h1>

		<Command.Root shouldFilter={false} class="relative w-full max-w-2xl">
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

		<div class="mt-36 grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
			<div class="flex flex-col gap-2">
				<Nav.Title>Most Popular</Nav.Title>
				<ol class="col-start-1 flex flex-col gap-2">
					{#each data.popular as registry (registry.url)}
						<li class="relative rounded-lg border px-6 py-4 transition-colors hover:bg-accent/50">
							<a
								href="/registries/{registry.url}"
								class="flex place-items-center gap-4 overflow-hidden"
							>
								<span class="absolute inset-0"></span>
								{@render registryIcon({ url: registry.url })}
								<span class="text-nowrap">{registry.url}</span>
							</a>
						</li>
					{/each}
				</ol>
			</div>

			<div class="flex flex-col gap-2">
				<Nav.Title>featured</Nav.Title>
				<ol class="col-start-2 flex flex-col gap-2">
					{#each data.featured as registry (registry.url)}
						<li class="relative rounded-lg border px-6 py-4 transition-colors hover:bg-accent/50">
							<a
								href="/registries/{registry.url}"
								class="flex place-items-center gap-4 overflow-hidden"
							>
								<span class="absolute inset-0"></span>
								{@render registryIcon({ url: registry.url })}
								<span class="text-nowrap">{registry.url}</span>
							</a>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</main>
