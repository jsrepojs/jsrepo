<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, children }: HTMLAttributes<HTMLSpanElement> = $props();
</script>

<span class={cn('font-mono text-xs uppercase tracking-wider text-muted-foreground', className)}>
	{@render children?.()}
</span>
