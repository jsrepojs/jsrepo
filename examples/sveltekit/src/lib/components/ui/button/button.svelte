<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLButtonAttributes } from 'svelte/elements';

    interface Props extends HTMLButtonAttributes {
        class?: string;
    }

    let { class: className, children }: Props = $props();
</script>

<button class={cn("bg-red-500 text-white font-bold size-20 rounded-full",className)}>
    {@render children?.()}
</button>