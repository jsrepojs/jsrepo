<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { JsrepoSnippet } from '$lib/components/ui/snippet';
	import { selectProvider, type Manifest } from 'jsrepo';
	import * as Icons from '$lib/components/icons';
	import { ArrowUpRightFromSquare, Braces, ChevronRight, File, FlaskRound } from 'lucide-svelte';
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

		for (const category of manifest) {
			for (const block of category.blocks) {
				for (const dep of [...block.dependencies, ...block.devDependencies]) {
					dependencies.add(dep);
				}
			}
		}

		return {
			categories: manifest.length,
			blocks: manifest.flatMap((c) => c.blocks).length,
			dependencies: Array.from(dependencies)
		};
	};

	const parseFileExtension = (file: string) => {
		const index = file.lastIndexOf('.');

		return file.slice(index);
	};

	const registryInfo = $derived(getRegistryInfo(manifest));

	onMount(() => {
		if (page.url.hash === '') {
			if (readme) {
				goto('#/');
			} else {
				goto('#blocks');
			}
		}
	});
</script>

<svelte:head>
	<title>jsrepo ~ {prettyUrl}</title>
</svelte:head>

<div class="max-w-5xl w-full flex flex-col gap-4 py-4">
	<div class="w-full">
		<div class="flex flex-col flex-wrap md:flex-row md:place-items-center gap-2">
			{#if provider?.name == 'http'}
				<a href={provider.baseUrl(registryUrl)} target="_blank">
					<h1 class="text-xl md:text-3xl font-bold flex place-items-center gap-2 text-nowrap">
						{prettyUrl}
						<ArrowUpRightFromSquare class="size-4 md:size-5 text-muted-foreground" />
					</h1>
				</a>
			{:else}
				<h1 class="text-xl md:text-3xl font-bold text-nowrap">{prettyUrl}</h1>
			{/if}
			{#if provider?.name !== 'http'}
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
		</div>
	</div>
	<div class="flex flex-col">
		<!-- tabs -->
		<div class="flex place-items-center border-b gap-2 py-1">
			{#if readme}
				<a
					href="#/"
					use:active={{ isHash: true }}
					class="font-medium p-2 data-[active=true]:text-foreground data-[active=true]:bg-accent hover:bg-accent transition-all text-muted-foreground hover:text-foreground rounded-md"
				>
					Readme
				</a>
			{/if}
			<a
				href="#blocks"
				use:active={{ isHash: true }}
				class="font-medium p-2 data-[active=true]:text-foreground data-[active=true]:bg-accent hover:bg-accent transition-all text-muted-foreground hover:text-foreground rounded-md"
			>
				Blocks
			</a>
			<a
				href="#dependencies"
				use:active={{ isHash: true }}
				class="font-medium p-2 data-[active=true]:text-foreground data-[active=true]:bg-accent hover:bg-accent transition-all text-muted-foreground hover:text-foreground rounded-md"
			>
				Dependencies
			</a>
		</div>
		{#if readme && checkIsActive( new URL('#/', page.url.href).toString(), { url: page.url, isHash: true } )}
			<!-- overview -->

			<div class="flex flex-col md:flex-row place-items-start w-full py-4 gap-4">
				<div class="w-full flex-grow">
					<div
						class="w-full prose prose-td:border-r prose-td:last:border-r-0 prose-th:p-2 prose-th:border-r prose-th:last:border-r-0 dark:prose-invert prose-tr:border-b prose-tr:border-border prose-table:border-x prose-thead:border-border prose-thead:border-y prose-td:p-2 prose-img:m-0"
					>
						{@html readme}
					</div>
				</div>
				<div class="w-full md:w-96 shrink-0">
					<JsrepoSnippet args={['init', prettyUrl ?? '']} />
					<div class="p-2 flex flex-col">
						<span class="text-muted-foreground font-medium">Source</span>
						<a
							href={provider?.baseUrl(registryUrl)}
							target="_blank"
							class="flex place-items-center gap-1 underline"
						>
							{provider?.baseUrl(registryUrl)}
						</a>
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
					</div>
				</div>
			</div>
		{:else if checkIsActive( new URL('#blocks', page.url.href).toString(), { url: page.url, isHash: true } ) || (page.url.hash === '' && !readme)}
			<!-- blocks -->

			<div class="flex flex-col gap-2 py-4">
				{#each manifest as category}
					{#each category.blocks.filter((b) => b.list) as block}
						<Collapsible.Root>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<button
										{...props}
										class="flex place-items-center justify-between w-full hover:bg-accent p-4 rounded-lg"
									>
										<div class="flex place-items-center gap-2">
											<span class="font-medium">
												{block.category}/{block.name}
											</span>
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
											{#each block.files as file}
												{@const ext = parseFileExtension(file)}
												<li class="flex place-items-center gap-1">
													<div class="size-4 flex place-items-center justify-center">
														{#if ext === '.svelte'}
															<Icons.Svelte class="size-4" />
														{:else if ext === '.ts'}
															<Icons.TypeScript class="size-3" />
														{:else if ext === '.js'}
															<Icons.JavaScript class="size-3" />
														{:else if ext === '.jsx' || ext === 'tsx'}
															<Icons.React class="size-4" />
														{:else if ext === '.vue'}
															<Icons.Vue class="size-3" />
														{:else if ext === '.html'}
															<Icons.HTML class="size-3" />
														{:else if ext === '.json' || ext === '.jsonc'}
															<Braces class="size-4 text-primary" />
														{:else if ext === '.yml' || ext === '.yaml'}
															<Icons.Yaml class="size-4" />
														{:else if ext === '.css'}
															<Icons.CSS class="size-3" />
														{:else if ext === '.sass' || ext === 'scss'}
															<Icons.SASS class="size-4" />
														{:else if ext === '.svg'}
															<Icons.Svg class="size-4" />
														{:else}
															<File class="size-4 text-muted-foreground" />
														{/if}
													</div>
													{file}
												</li>
											{/each}
										</ul>
									</div>
									<div>
										<span class="text-muted-foreground font-medium">Remote Dependencies</span>
										<ul>
											{#each [...block.dependencies, ...block.devDependencies] as dep}
												<li>{dep}</li>
											{/each}
										</ul>
									</div>
									<div>
										<span class="text-muted-foreground font-medium">Local Dependencies</span>
										<ul>
											{#each block.localDependencies as dep}
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
						{#each registryInfo.dependencies as dep}
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
		font-style: var(--shiki-dark-font-style) !important;
		font-weight: var(--shiki-dark-font-weight) !important;
		text-decoration: var(--shiki-dark-text-decoration) !important;
	}
</style>
