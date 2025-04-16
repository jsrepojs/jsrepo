<script lang="ts">
	import * as Icons from '$lib/components/icons';
	import { Braces } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		extension: string;
		fallback?: Snippet<[]>;
	};

	let { extension, fallback }: Props = $props();
</script>

{#if extension === '.svelte'}
	<Icons.Svelte class="size-4 shrink-0" />
{:else if extension === '.ts'}
	<Icons.TypeScript class="size-3 shrink-0" />
{:else if extension === '.js'}
	<Icons.JavaScript class="size-3 shrink-0" />
{:else if extension === '.jsx'}
	<Icons.React class="size-4 shrink-0 text-[#f7df1e]" />
{:else if extension === '.tsx'}
	<Icons.React class="size-4 shrink-0" />
{:else if extension === '.vue'}
	<Icons.Vue class="size-3 shrink-0" />
{:else if extension === '.html'}
	<Icons.HTML class="size-3 shrink-0" />
{:else if extension === '.json' || extension === '.jsonc'}
	<Braces class="size-4 shrink-0 text-primary" />
{:else if extension === '.yml' || extension === '.yaml'}
	<Icons.Yaml class="size-4 shrink-0" />
{:else if extension === '.css'}
	<Icons.CSS class="size-3 shrink-0" />
{:else if extension === '.sass' || extension === 'scss'}
	<Icons.SASS class="size-4 shrink-0" />
{:else if extension === '.svg'}
	<Icons.Svg class="size-4 shrink-0" />
{:else}
	{@render fallback?.()}
{/if}
