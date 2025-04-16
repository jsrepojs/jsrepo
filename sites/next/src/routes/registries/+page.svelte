<script lang="ts">
	import * as Nav from '$lib/components/site/nav';
	import { getIcon } from '$lib/ts/registry/client.js';
	import RegistrySearch from '$lib/components/site/registry-search.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	let { data } = $props();
</script>

<svelte:head>
	<title>jsrepo - Registries</title>
	<meta name="description" content="Discover and search jsrepo registries" />
</svelte:head>

<main class="container relative min-h-svh pb-4 pt-[--header-height]">
	<div class="mt-[25vh] flex flex-col place-items-center">
		<h1 class="py-8 text-5xl font-bold sm:text-7xl">Registries</h1>

		<RegistrySearch class="max-w-2xl" />

		<div class="mt-36 grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
			<div class="flex flex-col gap-2">
				<Nav.Title>Most Popular</Nav.Title>
				<ol class="col-start-1 flex flex-col gap-2">
					{#await data.popular}
						{#each { length: 5 } as _, i (i)}
							<li
								class="flex h-14 place-items-center justify-center rounded-lg border bg-card px-6 py-4"
							>
								<Skeleton class="h-4 w-full" />
							</li>
						{/each}
					{:then popular}
						{#each popular as registry (registry.url)}
							{@const Icon = getIcon(registry.url)}
							<li
								class="relative rounded-lg border bg-card px-6 py-4 transition-colors hover:bg-accent/50"
							>
								<a href="/registries/{registry.url}" class="flex place-items-center gap-4 truncate">
									<span class="absolute inset-0"></span>
									<Icon class="size-5 shrink-0" />
									<span class="text-nowrap">{registry.url}</span>
								</a>
							</li>
						{/each}
					{/await}
				</ol>
			</div>

			<div class="flex flex-col gap-2">
				<Nav.Title>featured</Nav.Title>
				<ol class="col-start-2 flex flex-col gap-2">
					{#await data.featured}
						{#each { length: 5 } as _, i (i)}
							<li
								class="flex h-14 place-items-center justify-center rounded-lg border bg-card px-6 py-4"
							>
								<Skeleton class="h-4 w-full" />
							</li>
						{/each}
					{:then featured}
						{#each featured as registry (registry.url)}
							{@const Icon = getIcon(registry.url)}
							<li
								class="relative rounded-lg border bg-card px-6 py-4 transition-colors hover:bg-accent/50"
							>
								<a href="/registries/{registry.url}" class="flex place-items-center gap-4 truncate">
									<span class="absolute inset-0"></span>
									<Icon class="size-5 shrink-0" />
									<span class="text-nowrap">{registry.url}</span>
								</a>
							</li>
						{/each}
					{/await}
				</ol>
			</div>
		</div>
	</div>
</main>
