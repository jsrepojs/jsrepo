<!--
	Installed from github/ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { WithChildren } from 'bits-ui';

	type Props = WithChildren<{
		class?: string;
	}>;

	let { children, class: className }: Props = $props();
</script>

<div
	class={cn(
		'aspect-video w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg',
		className
	)}
>
	<div class="border-b border-inherit p-4">
		<div class="flex items-center gap-2">
			<div class="size-2 rounded-full bg-[#ef4444]"></div>
			<div class="size-2 rounded-full bg-[#eab308]"></div>
			<div class="size-2 rounded-full bg-[#22c55e]"></div>
		</div>
	</div>
	<div class="h-full max-h-full max-w-full overflow-auto p-4">
		{@render children?.()}
	</div>
</div>
