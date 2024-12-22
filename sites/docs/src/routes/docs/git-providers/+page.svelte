<script lang="ts">
	import { DocHeader, Jsrepo, Link } from '$lib/components/site/docs';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { Snippet } from 'svelte';
	import * as Icons from '$lib/components/icons';

	type Support = {
		logo?: (opts: { size: number }) => ReturnType<Snippet>;
		name: string;
		href: string;
		status: '✅' | '⚠️' | '⌛️' | '🚫';
	};

	const support: Support[] = [
		{
			logo: github,
			name: 'GitHub',
			href: '/docs/git-providers/github',
			status: '✅'
		},
		{
			logo: gitlab,
			name: 'GitLab',
			href: '/docs/git-providers/gitlab',
			status: '✅'
		},
		{
			logo: bitbucket,
			name: 'BitBucket',
			href: '/docs/git-providers/bitbucket',
			status: '✅'
		},
		{
			logo: azureDevops,
			name: 'AzureDevops',
			href: '/docs/git-providers/azure-devops',
			status: '⚠️'
		}
	];
</script>

<!-- icon snippets -->

{#snippet github({ size }: { size: number })}
	<Icons.GitHub width={size} class="size-auto" />
{/snippet}

{#snippet gitlab({ size }: { size: number })}
	<Icons.GitLab width={size} class="size-auto" />
{/snippet}

{#snippet bitbucket({ size }: { size: number })}
	<Icons.BitBucket width={size} class="size-auto" />
{/snippet}

{#snippet azureDevops({ size }: { size: number })}
	<Icons.AzureDevops width={size} class="size-auto" />
{/snippet}

<DocHeader
	title="Git Providers"
	description="Git Providers that jsrepo supports in your registry."
/>
<p>
	<Jsrepo /> has to resolve paths to git providers meaning they must be explicity supported.
</p>
<div class="flex flex-col gap-1">
	<span>Legend:</span>
	<ul class="list-disc pl-5">
		<li>✅: Supported</li>
		<li>⌛️: In progress</li>
		<li>🚫: Not in progress</li>
		<li>⚠️: Partial support</li>
	</ul>
</div>
<Table.Root class="w-fit">
	<Table.Caption><Jsrepo /> provider support.</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Head>Provider</Table.Head>
			<Table.Head>Status</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each support as { name, logo, status, href }}
			<Table.Row>
				<Table.Cell>
					<div class="flex place-items-center gap-2">
						{#if logo}
							{@render logo({ size: 18 })}
						{/if}
						{#if status === '✅' || status === '⚠️'}
							<Link {href}>{name}</Link>
						{:else}
							<span class="text-muted-foreground">{name}</span>
						{/if}
					</div>
				</Table.Cell>
				<Table.Cell>{status}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
