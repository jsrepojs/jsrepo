<script lang="ts">
	import * as Nav from '$lib/components/site/nav';
	import { getIcon } from '$lib/ts/registry/client.js';
	import RegistrySearch from '$lib/components/site/registry-search.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>jsrepo - Registries</title>
	<meta name="description" content="Discover and search jsrepo registries" />
</svelte:head>

{#snippet registryIcon({ url }: { url: string })}
	{@const Icon = getIcon(url)}
	<Icon class="size-5 shrink-0" />
{/snippet}

<main class="relative pt-[--header-height]">
	<div class="mt-[25vh] flex flex-col place-items-center">
		<h1 class="py-8 text-5xl font-bold sm:text-7xl">Registries</h1>

		<RegistrySearch/>

		<div class="mt-36 grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
			<div class="flex flex-col gap-2">
				<Nav.Title>Most Popular</Nav.Title>
				<ol class="col-start-1 flex flex-col gap-2">
					{#each data.popular as registry (registry.url)}
						<li class="relative rounded-lg border px-6 py-4 transition-colors hover:bg-accent/50">
							<a
								href="/registries/{registry.url}"
								class="flex place-items-center gap-4 truncate"
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
								class="flex place-items-center gap-4 truncate"
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
