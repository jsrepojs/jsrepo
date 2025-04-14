<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Snippet } from '$lib/components/ui/snippet';
	import { getIcon } from '$lib/ts/registry/client';
	import * as Nav from '$lib/components/site/nav';
	import '../../../markdown.css';
	import { ExternalLink } from '@lucide/svelte';
	import { selectProvider, type Block, type Manifest } from 'jsrepo';
	import * as array from '$lib/ts/array';
	import { FileIcon } from '$lib/components/ui/file-icon';

	let { data } = $props();

	const Icon = $derived(getIcon(data.registryUrl));
	const provider = $derived(selectProvider(data.registryUrl));

	type RegistryInfo = {
		categories: number;
		blocks: number;
		dependencies: string[];
	};

	const getRegistryInfo = (manifest: Manifest): RegistryInfo => {
		const dependencies = new Set<string>();

		for (const category of manifest.categories) {
			for (const block of category.blocks) {
				for (const dep of [...block.dependencies, ...block.devDependencies]) {
					dependencies.add(dep);
				}
			}
		}

		return {
			categories: manifest.categories.length,
			blocks: manifest.categories.flatMap((c) => c.blocks).length,
			dependencies: Array.from(dependencies)
		};
	};

	const parseFileExtension = (file: string) => {
		const index = file.lastIndexOf('.');

		return file.slice(index);
	};

	const determinePrimaryLanguage = (...blocks: Block[]) => {
		const langMap = new Map<string, number>();

		const ifExistsIncrement = (key: string) => {
			const val = langMap.get(key) ?? 0;

			langMap.set(key, val + 1);
		};

		for (const block of blocks) {
			for (const file of block.files) {
				const ext = parseFileExtension(file);

				if (ext === 'yaml' || ext === 'yml') {
					ifExistsIncrement('yml');
					continue;
				}

				if (ext === 'json' || ext === 'jsonc') {
					ifExistsIncrement('json');
					continue;
				}

				if (ext === 'sass' || ext === 'scss') {
					ifExistsIncrement('sass');
					continue;
				}

				if (blocks.length === 1) {
					if (ext === '.svelte' || ext === 'tsx' || ext === 'jsx' || ext === 'vue') return ext;
				}

				ifExistsIncrement(ext);
			}
		}

		const arr = array
			.fromMap(langMap, (key, value) => ({ key, value }))
			.toSorted((a, b) => b.value - a.value);

		return arr[0].key;
	};

	const registryPrimaryLanguage = $derived(
		determinePrimaryLanguage(...data.manifest.categories.flatMap((c) => c.blocks))
	);

	const registryInfo = $derived(getRegistryInfo(data.manifest));
</script>

<svelte:head>
	<title>{data.registryUrl} - Registries - jsrepo</title>
	<meta name="description" content="Documentation for {data.registryUrl}" />
</svelte:head>

<div class="grid grid-cols-1 md:grid-cols-[1fr_20rem]">
	<div class="col-start-1">
		<div class="flex flex-col gap-2 py-4">
			<div>
				<h1 class="flex place-items-center gap-2 text-2xl font-medium">
					<Icon class="size-5" />
					{data.registryUrl}
					<FileIcon extension={registryPrimaryLanguage} />
				</h1>
				<p class="text-lg text-muted-foreground">{data.manifest.meta?.description}</p>
			</div>
			<Snippet text="jsrepo init {data.registryUrl}" class="w-fit" />
		</div>
		<div class="prose border-t py-4 md:pr-4">
			{@html data.readme}
		</div>
	</div>
	<div class="md:col-start-2">
		<div
			class="flex flex-col gap-4 border-t py-4 md:fixed md:h-[calc(100svh-var(--header-height)-64px)] md:border-l md:border-t-0 md:pl-4"
		>
			{#if data.manifest.meta?.tags && data.manifest.meta.tags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each data.manifest.meta.tags as tag}
						<Badge>{tag}</Badge>
					{/each}
				</div>
				<Separator />
			{/if}
			{#if data.manifest.meta?.homepage}
				<div class="flex flex-col">
					<Nav.Title>Homepage</Nav.Title>
					<a href={data.manifest.meta.homepage} class="truncate hover:underline">
						{data.manifest.meta.homepage}
						<ExternalLink class="inline size-3" />
					</a>
				</div>
			{/if}

			{#if data.manifest.meta?.repository}
				<div class="flex flex-col">
					<Nav.Title>Repository</Nav.Title>
					<a href={data.manifest.meta.repository} class="truncate hover:underline">
						{data.manifest.meta.repository}
						<ExternalLink class="inline size-3" />
					</a>
				</div>
			{:else if provider && provider?.name !== 'http'}
				{@const baseUrl = provider.baseUrl(data.registryUrl)}
				<div class="flex flex-col">
					<Nav.Title>Repository</Nav.Title>
					<a href={baseUrl} class="truncate hover:underline">
						{baseUrl}
						<ExternalLink class="inline size-3" />
					</a>
				</div>
			{/if}

			<div class="grid grid-cols-2 gap-4">
				<div class="flex flex-col">
					<Nav.Title>Categories</Nav.Title>
					<span>{registryInfo.categories}</span>
				</div>

				<div class="flex flex-col">
					<Nav.Title>Blocks</Nav.Title>
					<span>{registryInfo.blocks}</span>
				</div>

				<div class="flex flex-col">
					<Nav.Title>Dependencies</Nav.Title>
					<span>{registryInfo.dependencies.length}</span>
				</div>

				<div class="flex flex-col">
					<Nav.Title>Config Files</Nav.Title>
					<span>{(data.manifest.configFiles ?? []).length}</span>
				</div>
			</div>

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
</div>
