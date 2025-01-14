<script lang="ts">
	import { CodeSpan } from '$lib/components/site/docs';
	import { Badge } from '$lib/components/ui/badge';
	import type { Snippet } from 'svelte';

	type Props = {
		name: string;
		description: Snippet<[]>;
		usage?: Snippet<[]>;
		deprecated?: boolean;
	};

	let { name, description, usage, deprecated = false }: Props = $props();
</script>

<div class="flex flex-col gap-2 mb-5">
	<div class="flex place-items-center gap-2">
		<CodeSpan class="w-fit px-2">{name}</CodeSpan>
		{#if deprecated}
			<Badge variant="destructive">Deprecated</Badge>
		{/if}
	</div>
	<p>{@render description()}</p>
	<h3 class="text-lg font-bold">Usage</h3>
	{@render usage?.()}
</div>
