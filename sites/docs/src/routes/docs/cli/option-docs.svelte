<script lang="ts">
	import { CodeSpan } from '$lib/components/site/docs';
	import type { Snippet } from 'svelte';

	type Props = {
		name: string;
		description: Snippet<[]>;
		usage?: Snippet<[]>;
	};

	let { name, description, usage }: Props = $props();
</script>

<div class="flex flex-col gap-2 mb-5">
	<CodeSpan class="w-fit px-2">{name}</CodeSpan>
	<p>{@render description()}</p>
	<h3 class="text-lg font-bold">Usage</h3>
	{@render usage?.()}
</div>
