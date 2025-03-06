<script lang="ts">
	import { cn } from '$lib/utils/utils';
    import { type WithChildren } from 'bits-ui'

    type Props = {
        class?: string;
    }

    let { class: className, children }: WithChildren<Props> = $props();
</script>

<button class={cn("bg-red-500 text-white font-bold size-20 rounded-full",className)}>
    {@render children?.()}
</button>