<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { ChevronRight } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAnchorAttributes {
		children: Snippet<[]>;
		class?: string;
	}

	let { children, class: className, ...rest }: Props = $props();
</script>

<a class={cn('flex place-items-end sm:place-items-start flex-col group', className)} {...rest}>
	<span
		class="text-muted-foreground text-sm group-hover:text-primary transition-all flex place-items-center gap-1"
	>
		Next
		<ChevronRight
			class="size-4 text-muted-foreground group-hover:text-primary transition-all inline sm:hidden"
		/>
	</span>
	<div class="flex place-items-center gap-1 text-right font-medium">
		{@render children()}
		<ChevronRight
			class="size-5 text-muted-foreground group-hover:text-primary transition-all hidden sm:inline"
		/>
	</div>
</a>
