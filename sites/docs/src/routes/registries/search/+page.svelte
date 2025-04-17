<script lang="ts">
	import RegistrySearch from '$lib/components/site/registry-search.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Toggle } from '$lib/components/ui/toggle';
	import * as casing from '$lib/ts/casing';
	import { getIcon } from '$lib/ts/registry/client.js';
	import { ChevronLeft, ChevronRight, SortAsc, SortDesc } from '@lucide/svelte';
	import { queryParameters } from 'sveltekit-search-params';
	import * as Pagination from '$lib/components/ui/pagination';

	let { data } = $props();

	const params = queryParameters();

	let search = $state($params.query);

	let currentPage = $state(($params.offset ?? 0) / data.limit + 1);
	let orderBy = $state<'alphabetical' | 'views'>($params['order_by'] ?? 'alphabetical');

	const asc = $derived(!$params.order || $params.order === 'asc');
</script>

<svelte:head>
	<title>{$params.query} - jsrepo search</title>
	<meta name="description" content="Search jsrepo registries" />
</svelte:head>

<main class="min-h-svh pt-[--header-height]">
	<div class="fixed top-[--header-height] z-10 h-16 w-full border-b bg-background py-2">
		<div class="container">
			<RegistrySearch
				class="max-w-none"
				bind:search
				onSearch={(search) => ($params.query = search)}
			/>
		</div>
	</div>

	<div class="container pt-16">
		<div class="flex flex-col gap-4 py-4">
			<div class="flex place-items-center justify-between gap-2">
				<div>
					<span
						>{#await data.response then response}
							{#if response}
								{response.total} registries found
							{/if}
						{/await}</span
					>
				</div>
				<div class="flex place-items-center gap-2">
					<Toggle
						pressed={asc}
						onPressedChange={(state) => ($params.order = state ? 'asc' : 'desc')}
					>
						{#if asc}
							<SortAsc />
						{:else}
							<SortDesc />
						{/if}
					</Toggle>
					<Select.Root
						type="single"
						bind:value={orderBy}
						onValueChange={(v) => ($params['order_by'] = v)}
					>
						<Select.Trigger class="w-fit">
							Sort By: {casing.kebabToPascal(orderBy)}
						</Select.Trigger>
						<Select.Content align="end">
							<Select.Item value="alphabetical">Alphabetical</Select.Item>
							<Select.Item value="views">Views</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<ol class="flex flex-col gap-2">
				{#await data.response}
					{#each { length: 4 } as _, i (i)}
						<li
							class="flex h-14 place-items-center justify-center rounded-lg border bg-card px-6 py-4"
						>
							<Skeleton class="h-4 w-full" />
						</li>
					{/each}
				{:then response}
					{@const registries = response?.registries}
					{#if registries}
						{#each registries as registry (registry.url)}
							{@const Icon = getIcon(registry.url)}
							<li
								class="relative rounded-lg border bg-card px-6 py-4 transition-colors hover:bg-accent/50"
							>
								<a href="/registries/{registry.url}" class="flex place-items-center gap-4 truncate">
									<span class="absolute inset-0"></span>
									<Icon />
									<span class="text-nowrap">{registry.url}</span>
								</a>
							</li>
						{/each}
					{/if}
				{/await}
			</ol>
			<div class="flex place-items-center gap-2">
				{#await data.response then response}
					{#if response}
						<Pagination.Root
							bind:page={currentPage}
							onPageChange={(v) => ($params.offset = (v - 1) * data.limit)}
							count={response.total}
							perPage={data.limit}
						>
							{#snippet children({ pages, currentPage })}
								{#if pages.length > 1}
									<Pagination.Content>
										<Pagination.Item>
											<Pagination.PrevButton>
												<ChevronLeft class="size-4" />
												<span class="hidden sm:block">Previous</span>
											</Pagination.PrevButton>
										</Pagination.Item>
										{#each pages as page (page.key)}
											{#if page.type === 'ellipsis'}
												<Pagination.Item>
													<Pagination.Ellipsis />
												</Pagination.Item>
											{:else}
												<Pagination.Item>
													<Pagination.Link {page} isActive={currentPage === page.value}>
														{page.value}
													</Pagination.Link>
												</Pagination.Item>
											{/if}
										{/each}
										<Pagination.Item>
											<Pagination.NextButton>
												<span class="hidden sm:block">Next</span>
												<ChevronRight class="size-4" />
											</Pagination.NextButton>
										</Pagination.Item>
									</Pagination.Content>
								{/if}
							{/snippet}
						</Pagination.Root>
					{/if}
				{/await}
			</div>
		</div>
	</div>
</main>
