<script lang="ts">
	import SectionLabel from '$lib/components/site/section-label.svelte';
	import { Search } from '$lib/components/ui/search/index.js';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { getIcon } from '$lib/ts/registry/client.js';
	import type { RegistryResponse } from '../api/registries/types.js';
	import { useQuery } from '$lib/hooks/use-query.svelte.js';

	let { data } = $props();

	let search = $state('');
	let searching = $state(false);
	let completions: string[] = $state([]);

	const { query } = useQuery(async ({ signal }) => {
		searching = true;

		try {
			const response = await fetch(`/api/registries?limit=3&query=${search}`, {
				signal
			});

			if (!response.ok) return;

			const data = (await response.json()) as RegistryResponse;

			completions = data.registries.map((r) => r.url);
		} catch (err) {
			console.error(err);
		} finally {
			searching = false;
		}
	});
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
		<Command.Root shouldFilter={false} class="w-full max-w-2xl">
			<Popover.Root>
				<Popover.Trigger class="outline-none">
					<Command.Input
						bind:value={search}
						oninput={() => query()}
						class="h-12 rounded-lg border"
						placeholder="Search registries..."
					/>
				</Popover.Trigger>
				<Popover.Content trapFocus={false} class="w-[var(--bits-popover-anchor-width)] p-0">
					<Command.List>
						<Command.Group>
							{#each completions.filter((c) => c
									.toLowerCase()
									.includes(search.toLowerCase())) as url (url)}
								<Command.Item>{url}</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Popover.Content>
			</Popover.Root>
		</Command.Root>

		<div class="mt-36 grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
			<div class="flex flex-col gap-2">
				<SectionLabel>Most Popular</SectionLabel>
				<ol class="col-start-1 flex flex-col gap-2">
					{#each data.popular as registry (registry.url)}
						<li class="relative rounded-lg border px-6 py-4 transition-colors hover:bg-accent/50">
							<a href="/registries/{registry.url}" class="flex place-items-center gap-4">
								<span class="absolute inset-0"></span>
								{@render registryIcon({ url: registry.url })}
								{registry.url}
							</a>
						</li>
					{/each}
				</ol>
			</div>

			<div class="flex flex-col gap-2">
				<SectionLabel>featured</SectionLabel>
				<ol class="col-start-2 flex flex-col gap-2">
					{#each data.featured as registry (registry.url)}
						<li class="relative rounded-lg border px-6 py-4 transition-colors hover:bg-accent/50">
							<a href="/registries/{registry.url}" class="flex place-items-center gap-4">
								<span class="absolute inset-0"></span>
								{@render registryIcon({ url: registry.url })}
								{registry.url}
							</a>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</main>
