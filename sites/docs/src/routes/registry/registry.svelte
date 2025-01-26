<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { JsrepoSnippet } from '$lib/components/ui/snippet';
	import { selectProvider, type Manifest } from 'jsrepo';
	import * as Icons from '$lib/components/icons';
	import { ArrowUpRightFromSquare } from 'lucide-svelte';

	type Props = {
		registryUrl: string;
		manifest: Manifest;
		readme?: string;
	};

	let { registryUrl, manifest, readme }: Props = $props();

	const provider = $derived(selectProvider(registryUrl));

	const prettyUrl = $derived(provider?.parse(registryUrl, { fullyQualified: false }).url);
</script>

<div class="max-w-5xl w-full flex flex-col gap-4 py-4">
	<div class="w-full">
		<div class="flex place-items-center gap-2">
			<h1 class="text-4xl font-bold">{prettyUrl}</h1>
			{#if provider?.name !== 'http'}
				<Badge
					variant="secondary"
					class="flex text-base place-items-center gap-1 w-fit"
					href={provider?.baseUrl(registryUrl)}
				>
					{#if provider?.name === 'github'}
						<Icons.GitHub class="size-3" />
					{:else if provider?.name === 'gitlab'}
						<Icons.GitLab class="size-3" />
					{:else if provider?.name === 'bitbucket'}
						<Icons.BitBucket class="size-3" />
					{:else if provider?.name === 'azure'}
						<Icons.AzureDevops class="size-3" />
					{/if}
					{prettyUrl}
					<ArrowUpRightFromSquare class="size-3 text-muted-foreground" />
				</Badge>
			{/if}
		</div>
	</div>
	<div class="flex place-items-start w-full border-t py-4 gap-4">
		<div
			class="w-full flex-grow prose prose-td:border-r prose-td:last:border-r-0 dark:prose-invert prose-tr:border-b prose-tr:border-border prose-table:border-x prose-thead:border-border prose-thead:border-y prose-td:p-2 prose-img:m-0"
		>
			{#if readme}
				{@html readme}
			{/if}
		</div>
		<div class="w-96 shrink-0">
			<JsrepoSnippet args={['init', prettyUrl ?? '']} />
			<div class="grid grid-cols-2">
				<div class="flex flex-col p-2">
					<span class="text-muted-foreground">Categories</span>
					<span>{manifest.length}</span>
				</div>
				<div class="flex flex-col p-2">
					<span class="text-muted-foreground">Blocks</span>
					<span>{manifest.flatMap((c) => c.blocks).length}</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	/* Shiki see: https://shiki.matsu.io/guide/dual-themes#class-based-dark-mode */
	:global(html.dark .shiki, html.dark .shiki span) {
		color: var(--shiki-dark) !important;
		font-style: var(--shiki-dark-font-style) !important;
		font-weight: var(--shiki-dark-font-weight) !important;
		text-decoration: var(--shiki-dark-text-decoration) !important;
	}
</style>
