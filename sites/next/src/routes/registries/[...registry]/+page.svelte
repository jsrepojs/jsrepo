<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Snippet } from '$lib/components/ui/snippet';
	import { getIcon } from '$lib/ts/registry/client';
	import * as Nav from '$lib/components/site/nav';
	import '../../../markdown.css';
	import { ExternalLink } from '@lucide/svelte';
	import { selectProvider } from 'jsrepo';

	let { data } = $props();

	const Icon = $derived(getIcon(data.registryUrl));
	const provider = $derived(selectProvider(data.registryUrl));
</script>

<div class="grid grid-cols-1 md:grid-cols-[1fr_20rem]">
	<div class="col-start-1">
		<div class="flex flex-col gap-2 py-4">
			<div>
				<h1 class="flex place-items-center gap-2 text-2xl font-medium">
					<Icon class="size-5" />
					{data.registryUrl}
				</h1>
				<p class="text-lg text-muted-foreground">{data.manifest.meta?.description}</p>
			</div>
			<Snippet text="jsrepo init {data.registryUrl}" class="w-fit" />
		</div>
		<div class="prose border-t py-4 pr-4">
			{@html data.readme}
		</div>
	</div>
	<div class="flex flex-col gap-4 py-4 pl-4 md:col-start-2 md:border-l">
		<div>
			{#if data.manifest.meta?.tags && data.manifest.meta.tags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each data.manifest.meta.tags as tag}
						<Badge>{tag}</Badge>
					{/each}
				</div>
			{/if}
		</div>
		<Separator />
		{#if data.manifest.meta?.homepage}
			<div class="flex flex-col">
				<Nav.Title>Homepage</Nav.Title>
				<a href={data.manifest.meta.homepage} class="text-sm hover:underline">
					{data.manifest.meta.homepage}
					<ExternalLink class="inline size-3" />
				</a>
			</div>
		{/if}

		{#if data.manifest.meta?.repository}
			<div class="flex flex-col">
				<Nav.Title>Repository</Nav.Title>
				<a href={data.manifest.meta.repository} class="text-sm hover:underline">
					{data.manifest.meta.repository}
					<ExternalLink class="inline size-3" />
				</a>
			</div>
		{:else if provider && provider?.name !== 'http'}
			{@const baseUrl = provider.baseUrl(data.registryUrl)}
			<div class="flex flex-col">
				<Nav.Title>Repository</Nav.Title>
				<a href={baseUrl} class="text-sm hover:underline">
					{baseUrl}
					<ExternalLink class="inline size-3" />
				</a>
			</div>
		{/if}

		{#if data.manifest.meta?.authors}
			<div class="flex flex-col">
				<Nav.Title>Authors</Nav.Title>
				<div class="flex flex-wrap gap-2">
					{#each data.manifest.meta.authors as author, i (author)}
						<span>{author}{i < data.manifest.meta.authors.length - 1 ? ',' : ''}</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
