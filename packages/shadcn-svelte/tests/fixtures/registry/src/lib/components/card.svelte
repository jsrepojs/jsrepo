<script lang="ts">
	import * as Widget from '$lib/components/ui/widget/index.js';
	import { cn } from '$lib/utils';

	let { class: className, children } = $props();
</script>

<div class={cn('card', className)}>
	<Widget.Root>{@render children?.()}</Widget.Root>
</div>
