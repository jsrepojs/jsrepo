<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { JsrepoSnippet } from '$lib/components/ui/snippet';
	import { http, selectProvider, type Block, type Manifest } from 'jsrepo';
	import * as Icons from '$lib/components/icons';
	import { ArrowUpRightFromSquare, ChevronRight, File, FlaskRound } from '@lucide/svelte';
	import { active, checkIsActive } from '$lib/actions/active.svelte';
	import { page } from '$app/state';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { cn } from '$lib/utils/utils';
	import { parsePackageName } from '$lib/ts/parse-package-name';
	import { Separator } from '$lib/components/ui/separator';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import * as Table from '$lib/components/ui/table';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as array from '$lib/ts/array';
	import { FileIcon } from '$lib/components/ui/file-icon';
	import { Code } from '$lib/components/ui/code';

	type Props = {
		registryUrl: string;
		manifest: Manifest;
		readme?: string;
	};

	let { registryUrl, manifest, readme }: Props = $props();

	const provider = $derived(selectProvider(registryUrl));

	const prettyUrl = $derived(provider?.parse(registryUrl, { fullyQualified: false }).url);

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
		determinePrimaryLanguage(...manifest.categories.flatMap((c) => c.blocks))
	);

	const registryInfo = $derived(getRegistryInfo(manifest));

	onMount(() => {
		// default to overview screen
		if (page.url.hash === '') {
			goto('#/');
		}
	});
</script>

<svelte:head>
	<title>jsrepo ~ {prettyUrl}</title>
</svelte:head>

<div class="max-w-7xl w-full flex flex-col gap-4 py-4">
	<div class="w-full flex flex-col gap-2">
		<div class="flex flex-wrap md:place-items-center gap-2">
			{#if provider?.name == 'http'}
				<a href={provider.baseUrl(registryUrl)} target="_blank">
					<h1 class="text-2xl font-bold flex place-items-center gap-2">
						{prettyUrl}
						<ArrowUpRightFromSquare class="size-4 md:size-5 text-muted-foreground" />
					</h1>
				</a>
			{:else}
				<h1 class="font-bold text-2xl">{prettyUrl}</h1>
			{/if}
			<div class="flex place-items-center flex-wrap gap-2">
				{#if manifest.meta?.repository}
					{@const repoProvider = selectProvider(manifest.meta.repository)}
					<Badge
						variant="secondary"
						class="flex text-base text-nowrap font-medium place-items-center gap-1.5 w-fit"
						target="_blank"
						href={repoProvider?.baseUrl(manifest.meta.repository)}
					>
						{#if repoProvider?.name === 'github'}
							<Icons.GitHub class="size-4" />
						{:else if repoProvider?.name === 'gitlab'}
							<Icons.GitLab class="size-4" />
						{:else if repoProvider?.name === 'bitbucket'}
							<Icons.BitBucket class="size-4" />
						{:else if repoProvider?.name === 'azure'}
							<Icons.AzureDevops class="size-4" />
						{/if}
						{repoProvider?.parse(manifest.meta.repository, { fullyQualified: false }).url}
						<ArrowUpRightFromSquare class="size-4 text-muted-foreground" />
					</Badge>
				{:else if provider?.name !== 'http'}
					<Badge
						variant="secondary"
						class="flex text-sm font-medium place-items-center gap-1 w-fit"
						target="_blank"
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
				<FileIcon extension={registryPrimaryLanguage} />
			</div>
		</div>
		<p class="text-muted-foreground text-lg">
			{#if manifest.meta?.description}
				{manifest.meta.description}
			{/if}
		</p>
	</div>
	<div class="flex flex-col">
		<!-- tabs -->
		<div
			class="flex place-items-center scrollbar-hide border-b gap-2 py-1 max-w-full overflow-x-auto"
		>
			<a
				href="#/"
				use:active={{ isHash: true }}
				class="font-medium text-nowrap p-2 data-[active=true]:text-foreground data-[active=true]:bg-accent hover:bg-accent transition-all text-muted-foreground hover:text-foreground rounded-md"
			>
				Overview
			</a>
			<a
				href="#blocks"
				use:active={{ isHash: true }}
				class="font-medium text-nowrap p-2 data-[active=true]:text-foreground data-[active=true]:bg-accent hover:bg-accent transition-all text-muted-foreground hover:text-foreground rounded-md"
			>
				Blocks
			</a>
			<a
				href="#dependencies"
				use:active={{ isHash: true }}
				class="font-medium text-nowrap flex place-items-center justify-center gap-2 p-2 data-[active=true]:text-foreground data-[active=true]:bg-accent hover:bg-accent transition-all text-muted-foreground hover:text-foreground rounded-md"
			>
				Dependencies <Badge class="font-mono px-1.5">{registryInfo.dependencies.length}</Badge>
			</a>
			<a
				href="#manifest"
				use:active={{ isHash: true }}
				class="font-medium text-nowrap p-2 data-[active=true]:text-foreground data-[active=true]:bg-accent hover:bg-accent transition-all text-muted-foreground hover:text-foreground rounded-md"
			>
				Manifest
			</a>
		</div>
		{#if checkIsActive(new URL('#/', page.url.href).toString(), { url: page.url, isHash: true })}
			<!-- overview -->

			<div class="flex flex-col md:flex-row place-items-start w-full py-4 gap-4">
				<div class="w-full flex-grow">
					<div
						class="w-full prose max-w-none lg:prose-lg prose-td:border-r prose-td:last:border-r-0 prose-th:p-2 prose-th:border-r prose-th:last:border-r-0 dark:prose-invert prose-tr:border-b prose-tr:border-border prose-table:border-x prose-thead:border-border prose-thead:border-y prose-td:p-2 prose-img:m-0"
					>
						{#if readme}
							{@html readme}
						{:else}
							<div class="flex place-items-center flex-col gap-2 justify-center h-96">
								<span class="text-muted-foreground text-lg">
									This registry doesn't have a README.
								</span>
								<span class="text-xs text-muted-foreground">
									Add a README.md to the root of the registry for it to be displayed here.
								</span>
							</div>
						{/if}
					</div>
				</div>
				<div class="w-full md:w-96 shrink-0">
					<JsrepoSnippet args={['init', prettyUrl ?? '']} class="mb-2" />
					{#if manifest.meta?.tags}
						<div class="flex flex-wrap place-items-center gap-2 pb-2">
							{#each manifest.meta.tags as tag, i (i)}
								<Badge variant="secondary">{tag}</Badge>
							{/each}
						</div>
					{/if}
					{#if manifest.meta?.repository}
						<div class="p-2 flex flex-col">
							<span class="text-muted-foreground font-medium">Repository</span>
							<a
								href={manifest.meta?.repository}
								target="_blank"
								class="flex place-items-center gap-1 underline"
							>
								{manifest.meta?.repository}
							</a>
						</div>
						<Separator />
					{:else if provider?.name !== http.name}
						<div class="p-2 flex flex-col">
							<span class="text-muted-foreground font-medium">Repository</span>
							<a
								href={provider?.baseUrl(registryUrl)}
								target="_blank"
								class="flex place-items-center gap-1 underline"
							>
								{provider?.baseUrl(registryUrl)}
							</a>
						</div>
						<Separator />
					{/if}
					<div class="p-2 flex flex-col">
						{#if manifest.meta?.homepage}
							<span class="text-muted-foreground font-medium">Homepage</span>
							<a
								href={manifest.meta?.homepage}
								target="_blank"
								class="flex place-items-center gap-1 underline"
							>
								{manifest.meta?.homepage}
							</a>
						{:else}
							<span class="text-muted-foreground font-medium">Homepage</span>
							<a
								href={provider?.baseUrl(registryUrl)}
								target="_blank"
								class="flex place-items-center gap-1 underline"
							>
								{provider?.baseUrl(registryUrl)}
							</a>
						{/if}
					</div>
					<Separator />
					<div class="grid grid-cols-2 gap-2 py-2">
						<div class="flex flex-col p-2">
							<span class="text-muted-foreground font-medium">Categories</span>
							<span>{registryInfo.categories}</span>
						</div>
						<div class="flex flex-col p-2">
							<span class="text-muted-foreground font-medium">Blocks</span>
							<span>{registryInfo.blocks}</span>
						</div>
					</div>
					<Separator />
					<div class="grid grid-cols-2 gap-2 py-2">
						<div class="flex flex-col p-2">
							<span class="text-muted-foreground font-medium">Dependencies</span>
							<span>{registryInfo.dependencies.length}</span>
						</div>
						<div class="flex flex-col p-2">
							<span class="text-muted-foreground font-medium">Config Files</span>
							<span>{(manifest.configFiles ?? []).length}</span>
						</div>
					</div>
					{#if manifest.meta?.authors}
						<Separator />
						<div class="p-2 flex flex-col">
							<span class="text-muted-foreground font-medium">Authors</span>
							<span>{manifest.meta?.authors?.join(' ,')}</span>
						</div>
					{/if}
				</div>
			</div>
		{:else if checkIsActive( new URL('#blocks', page.url.href).toString(), { url: page.url, isHash: true } )}
			<!-- blocks -->

			<div class="flex flex-col gap-2 py-4">
				{#each manifest.categories as category (category)}
					{#each category.blocks.filter((b) => b.list) as block (block.name)}
						{@const primaryLanguage = determinePrimaryLanguage(block)}
						<Collapsible.Root>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<button
										{...props}
										class="flex place-items-center justify-between border w-full hover:bg-accent p-4 rounded-lg"
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
								<div class="p-4 flex flex-col gap-2 rounded-md border-border border mt-2">
									<div>
										<span class="text-muted-foreground font-medium">Files</span>
										<ul>
											{#each block.files as file (file)}
												{@const ext = parseFileExtension(file)}
												<li class="flex place-items-center gap-1">
													<div class="size-4 flex place-items-center justify-center">
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
										<span class="text-muted-foreground font-medium">Remote Dependencies</span>
										<ul>
											{#each [...block.dependencies, ...block.devDependencies] as dep (dep)}
												<li>{dep}</li>
											{/each}
										</ul>
									</div>
									<div>
										<span class="text-muted-foreground font-medium">Local Dependencies</span>
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
		{:else if checkIsActive( new URL('#manifest', page.url.href).toString(), { url: page.url, isHash: true } )}
			<div class="py-4">
				<Code lang="json" code={JSON.stringify(manifest, null, '\t')} class="max-h-none" />
			</div>
		{:else if checkIsActive( new URL('#dependencies', page.url.href).toString(), { url: page.url, isHash: true } )}
			<div class="py-4">
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
									{pkg.name}
								</Table.Cell>
								<Table.Cell>
									{pkg.version}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	/* Shiki see: https://shiki.matsu.io/guide/dual-themes#class-based-dark-mode */
	:global(html.dark .shiki, html.dark .shiki span) {
		color: var(--shiki-dark) !important;
		background-color: var(--bg-background) !important;
		font-style: var(--shiki-dark-font-style) !important;
		font-weight: var(--shiki-dark-font-weight) !important;
		text-decoration: var(--shiki-dark-text-decoration) !important;
	}
	:global(pre.shiki) {
		@apply border border-border;
	}
</style>
