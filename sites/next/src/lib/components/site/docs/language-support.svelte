<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import type { Snippet } from 'svelte';
	import * as Icons from '$lib/components/icons';
	import { Braces } from '@lucide/svelte';

	type Status = '✅' | '⌛️' | '🚫' | '⚠️';

	type SupportedLanguage = {
		logo?: (opts: { size: number }) => ReturnType<Snippet>;
		name: string;
		dependencyResolutionStatus: Status;
		formattingStatus: Status;
		watermarkStatus: Status;
	};

	const supportedLanguages: SupportedLanguage[] = [
		{
			logo: javascript,
			name: '*.js',
			dependencyResolutionStatus: '✅',
			formattingStatus: '✅',
			watermarkStatus: '✅'
		},
		{
			logo: typescript,
			name: '*.ts',
			dependencyResolutionStatus: '✅',
			formattingStatus: '✅',
			watermarkStatus: '✅'
		},
		{
			logo: jsx,
			name: '*.jsx',
			dependencyResolutionStatus: '✅',
			formattingStatus: '✅',
			watermarkStatus: '✅'
		},
		{
			logo: tsx,
			name: '*.tsx',
			dependencyResolutionStatus: '✅',
			formattingStatus: '✅',
			watermarkStatus: '✅'
		},
		{
			logo: svelte,
			name: '*.svelte',
			dependencyResolutionStatus: '✅',
			formattingStatus: '⚠️',
			watermarkStatus: '✅'
		},
		{
			logo: vue,
			name: '*.vue',
			dependencyResolutionStatus: '✅',
			formattingStatus: '⚠️',
			watermarkStatus: '✅'
		},
		{
			logo: yaml,
			name: '*.(yaml|yml)',
			dependencyResolutionStatus: '🚫',
			formattingStatus: '⚠️',
			watermarkStatus: '✅'
		},
		{
			logo: json,
			name: '*.json',
			dependencyResolutionStatus: '🚫',
			formattingStatus: '✅',
			watermarkStatus: '🚫'
		},
		{
			logo: json,
			name: '*.jsonc',
			dependencyResolutionStatus: '🚫',
			formattingStatus: '✅',
			watermarkStatus: '✅'
		},
		{
			logo: css,
			name: '*.css',
			dependencyResolutionStatus: '✅',
			formattingStatus: '✅',
			watermarkStatus: '✅'
		},
		{
			logo: svg,
			name: '*.svg',
			dependencyResolutionStatus: '🚫',
			formattingStatus: '🚫',
			watermarkStatus: '✅'
		},
		{
			logo: sass,
			name: '*.(sass|scss)',
			dependencyResolutionStatus: '✅',
			formattingStatus: '⚠️',
			watermarkStatus: '✅'
		},
		{
			logo: html,
			name: '*.(html)',
			dependencyResolutionStatus: '⚠️',
			formattingStatus: '⚠️',
			watermarkStatus: '✅'
		}
	];
</script>

<!-- icon snippets -->

{#snippet typescript({ size }: { size: number })}
	<Icons.TypeScript width={size} class="size-auto" />
{/snippet}

{#snippet javascript({ size }: { size: number })}
	<Icons.JavaScript width={size} class="size-auto" />
{/snippet}

{#snippet tsx({ size }: { size: number })}
	<Icons.React width={size} class="size-auto" />
{/snippet}

{#snippet jsx({ size }: { size: number })}
	<Icons.React width={size} class="size-auto text-[#f7df1e]" />
{/snippet}

{#snippet svelte({ size }: { size: number })}
	<Icons.Svelte width={size} class="size-auto" />
{/snippet}

{#snippet vue({ size }: { size: number })}
	<Icons.Vue width={size} class="size-auto" />
{/snippet}

{#snippet yaml({ size }: { size: number })}
	<Icons.Yaml height={size} class="size-auto" />
{/snippet}

{#snippet json({ size }: { size: number })}
	<Braces height={size} class="size-[18px] text-[#f7df1e]" />
{/snippet}

{#snippet svg({ size }: { size: number })}
	<Icons.Svg height={size} class="size-auto" />
{/snippet}

{#snippet css({ size }: { size: number })}
	<Icons.CSS height={size} />
{/snippet}

{#snippet sass({ size }: { size: number })}
	<Icons.SASS height={size} />
{/snippet}

{#snippet html({ size }: { size: number })}
	<Icons.HTML height={size} />
{/snippet}

<Table.Root class="mt-4 w-fit">
	<Table.Header>
		<Table.Row>
			<Table.Head>Language</Table.Head>
			<Table.Head>Dependencies</Table.Head>
			<Table.Head>Formatting</Table.Head>
			<Table.Head>Watermarks</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each supportedLanguages as { name, logo, dependencyResolutionStatus, formattingStatus, watermarkStatus } (name)}
			<Table.Row>
				<Table.Cell>
					<div class="flex place-items-center gap-2">
						{#if logo}
							{@render logo({ size: 18 })}
						{/if}
						<code>{name}</code>
					</div>
				</Table.Cell>
				<Table.Cell>{dependencyResolutionStatus}</Table.Cell>
				<Table.Cell>{formattingStatus}</Table.Cell>
				<Table.Cell>{watermarkStatus}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
