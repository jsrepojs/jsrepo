<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet<[]>;
		class?: string;
	};
	import { cn } from '$lib/utils';

	let { children, class: className }: Props = $props();
</script>

<span class={cn('bg-secondary p-1 rounded-md font-mono text-sm text-nowrap', className)}>
	{@render children()}
</span>
