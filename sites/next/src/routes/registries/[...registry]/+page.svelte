<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Snippet } from '$lib/components/ui/snippet';
	import { getIcon } from '$lib/ts/registry/client';
	import * as Nav from '$lib/components/site/nav';
	import '../../../markdown.css';
	import { ChevronRight, ExternalLink, File, FlaskRound } from '@lucide/svelte';
	import { selectProvider, type Block, type Manifest } from 'jsrepo';
	import * as array from '$lib/ts/array';
	import { FileIcon } from '$lib/components/ui/file-icon';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';
	import * as Table from '$lib/components/ui/table';
	import { parsePackageName } from '$lib/ts/parse-package-name';
	import { Code } from '$lib/components/ui/code';

	let { data } = $props();

	const Icon = $derived(getIcon(data.registryUrl));
	const provider = $derived(selectProvider(data.registryUrl));

	type RegistryInfo = {
		categories: number;
		blocks: number;
		dependencies: string[];
	};

	function getRegistryInfo(manifest: Manifest): RegistryInfo {
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
	}

	function parseFileExtension(file: string) {
		const index = file.lastIndexOf('.');

		return file.slice(index);
	}

	function determinePrimaryLanguage(...blocks: Block[]) {
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
	}

	const registryPrimaryLanguage = $derived(
		determinePrimaryLanguage(...data.manifest.categories.flatMap((c) => c.blocks))
	);

	const registryInfo = $derived(getRegistryInfo(data.manifest));
</script>

<svelte:head>
	<title>{data.registryUrl} - Registries - jsrepo</title>
	<meta name="description" content="Documentation for {data.registryUrl}" />
</svelte:head>

<div class="grid grid-cols-1 md:grid-cols-[1fr_18rem]">
	<div class="col-start-1">
		<div class="flex flex-col gap-2 py-4 md:pr-4">
			<div>
				<h1 class="flex place-items-center gap-2 truncate text-2xl font-medium">
					<Icon class="hidden size-5 shrink-0 sm:block" />
					{data.registryUrl}
					<span class="hidden sm:inline">
						<FileIcon extension={registryPrimaryLanguage} />
					</span>
				</h1>
				{#if data.manifest.meta?.description}
					<p class="text-muted-foreground md:text-lg">{data.manifest.meta?.description}</p>
				{/if}
			</div>
			<Snippet text="jsrepo init {data.registryUrl}" class="w-fit" />
		</div>
		<Tabs.Root value="readme">
			<Tabs.List class="max-w-full gap-1 overflow-x-auto bg-transparent p-0">
				<Tabs.Trigger
					value="readme"
					class="py-2 transition-all hover:bg-accent hover:text-foreground data-[state=active]:bg-accent"
				>
					README
				</Tabs.Trigger>
				<Tabs.Trigger
					value="blocks"
					class="py-2 transition-all hover:bg-accent hover:text-foreground data-[state=active]:bg-accent"
				>
					Blocks
				</Tabs.Trigger>
				<Tabs.Trigger
					value="dependencies"
					class="py-2 transition-all hover:bg-accent hover:text-foreground data-[state=active]:bg-accent"
				>
					Dependencies
				</Tabs.Trigger>
				<Tabs.Trigger
					value="manifest"
					class="py-2 transition-all hover:bg-accent hover:text-foreground data-[state=active]:bg-accent"
				>
					Manifest
				</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="readme" class="border-t py-4 md:pr-4">
				<div class="prose">
					{#if data.readme}
						{@html data.readme}
					{:else}
						<div class="flex h-96 flex-col place-items-center justify-center gap-2">
							<span class="text-lg text-muted-foreground">
								This registry doesn't have a README.
							</span>
							<span class="text-xs text-muted-foreground">
								Add a README.md to the root of the registry for it to be displayed here.
							</span>
						</div>
					{/if}
				</div>
			</Tabs.Content>
			<Tabs.Content value="blocks" class="border-t py-4 md:pr-4">
				<div class="flex flex-col gap-2">
					{#each data.manifest.categories as category (category)}
						{#each category.blocks.filter((b) => b.list) as block (block.name)}
							{@const primaryLanguage = determinePrimaryLanguage(block)}
							<Collapsible.Root>
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<button
											{...props}
											class="flex w-full place-items-center justify-between rounded-lg border p-4 hover:bg-accent"
										>
											<div class="flex place-items-center gap-2">
												<span class="font-medium">
													{block.category}/{block.name}
												</span>
												<FileIcon extension={primaryLanguage} />
												{#if block.tests}
													<Tooltip.Provider delayDuration={50}>
														<Tooltip.Root>
															<Tooltip.Trigger>
																<FlaskRound class="size-4 text-blue-400" />
															</Tooltip.Trigger>
															<Tooltip.Content>
																<p>Includes tests</p>
															</Tooltip.Content>
														</Tooltip.Root>
													</Tooltip.Provider>
												{/if}
											</div>
											<ChevronRight
												class={cn('size-5 text-muted-foreground', {
													'rotate-90': props['aria-expanded'] === 'true'
												})}
											/>
										</button>
									{/snippet}
								</Collapsible.Trigger>
								<Collapsible.Content>
									<div class="mt-2 flex flex-col gap-2 rounded-md border border-border p-4">
										<div>
											<span class="font-medium text-muted-foreground">Files</span>
											<ul>
												{#each block.files as file (file)}
													{@const ext = parseFileExtension(file)}
													<li class="flex place-items-center gap-1">
														<div class="flex size-4 place-items-center justify-center">
															<FileIcon extension={ext}>
																{#snippet fallback()}
																	<File class="size-4 text-muted-foreground" />
																{/snippet}
															</FileIcon>
														</div>
														{file}
													</li>
												{/each}
											</ul>
										</div>
										<div>
											<span class="font-medium text-muted-foreground">Remote Dependencies</span>
											<ul>
												{#each [...block.dependencies, ...block.devDependencies] as dep (dep)}
													<li>{dep}</li>
												{/each}
											</ul>
										</div>
										<div>
											<span class="font-medium text-muted-foreground">Local Dependencies</span>
											<ul>
												{#each block.localDependencies as dep (dep)}
													<li>{dep}</li>
												{/each}
											</ul>
										</div>
									</div>
								</Collapsible.Content>
							</Collapsible.Root>
						{/each}
					{/each}
				</div>
			</Tabs.Content>
			<Tabs.Content value="dependencies" class="border-t py-4 md:pr-4">
				<Table.Root class="w-full">
					<Table.Header>
						<Table.Row>
							<Table.Head>Package</Table.Head>
							<Table.Head>Version</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each registryInfo.dependencies as dep (dep)}
							{@const pkg = parsePackageName(dep).unwrap()}
							<Table.Row>
								<Table.Cell>
									<a href="https://npmjs.com/package/{pkg.name}" target="_blank">
										{pkg.name}
									</a>
								</Table.Cell>
								<Table.Cell>
									{pkg.version}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Tabs.Content>
			<Tabs.Content value="manifest" class="border-t py-4 md:pr-4">
				<div class="md:max-w-[calc(100vw-18rem-4rem-1rem)]">
					<Code lang="json" code={JSON.stringify(data.manifest, null, '\t')} class="max-h-none" />
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<!-- Aside -->
	<div class="md:col-start-2">
		<div
			class="flex w-full flex-col gap-4 border-t py-4 md:sticky md:top-[calc(var(--header-height)+64px)] md:h-[calc(100svh-var(--header-height))] md:max-w-[18rem] md:border-l md:border-t-0 md:pl-4"
		>
			{#if data.manifest.meta?.tags && data.manifest.meta.tags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each data.manifest.meta.tags as tag, i (i)}
						<Badge>{tag}</Badge>
					{/each}
				</div>
				<Separator />
			{/if}
			{#if data.manifest.meta?.homepage}
				<div class="flex flex-col">
					<Nav.Title>Homepage</Nav.Title>
					<a href={data.manifest.meta.homepage} target="_blank" class="truncate hover:underline">
						{data.manifest.meta.homepage}
						<ExternalLink class="inline size-3" />
					</a>
				</div>
			{/if}

			{#if data.manifest.meta?.repository}
				<div class="flex flex-col">
					<Nav.Title>Repository</Nav.Title>
					<a href={data.manifest.meta.repository} target="_blank" class="truncate hover:underline">
						{data.manifest.meta.repository}
						<ExternalLink class="inline size-3" />
					</a>
				</div>
			{:else if provider && provider?.name !== 'http'}
				{@const baseUrl = provider.baseUrl(data.registryUrl)}
				<div class="flex flex-col">
					<Nav.Title>Repository</Nav.Title>
					<a href={baseUrl} target="_blank" class="truncate hover:underline">
						{baseUrl}
						<ExternalLink class="inline size-3" />
					</a>
				</div>
			{/if}

			<div class="grid w-fit grid-cols-2 gap-4">
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
