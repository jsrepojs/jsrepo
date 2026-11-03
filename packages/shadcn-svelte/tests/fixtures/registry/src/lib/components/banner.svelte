<!-- @fixture-header: stripped by a jsrepo transform -->
<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { class: className, children } = $props();
</script>

<div class={cn('banner', className)}>{@render children?.()}</div>
