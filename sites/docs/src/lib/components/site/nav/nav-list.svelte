<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, children, ...rest }: HTMLAttributes<HTMLUListElement> = $props();
</script>

<ul {...rest} class={cn('flex flex-col font-light text-muted-foreground', className)}>
	{@render children?.()}
</ul>
