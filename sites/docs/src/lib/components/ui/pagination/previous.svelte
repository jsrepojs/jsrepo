<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { ChevronLeft } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAnchorAttributes {
		children: Snippet<[]>;
		class?: string;
	}

	let { children, class: className, ...rest }: Props = $props();
</script>

<a class={cn('flex place-items-start sm:place-items-end flex-col group', className)} {...rest}>
	<span
		class="text-muted-foreground text-sm group-hover:text-primary transition-all flex place-items-center gap-1"
	>
		<ChevronLeft
			class="size-4 text-muted-foreground group-hover:text-primary transition-all inline sm:hidden"
		/>
		Previous
	</span>
	<div class="flex place-items-center gap-1 text-left font-medium">
		<ChevronLeft
			class="size-5 text-muted-foreground group-hover:text-primary transition-all hidden sm:inline"
		/>
		{@render children()}
	</div>
</a>
