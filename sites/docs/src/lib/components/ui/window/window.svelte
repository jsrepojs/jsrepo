<!--
	jsrepo 1.36.0
	Installed from github/ieedan/shadcn-svelte-extras
	2-16-2025
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { WithChildren } from 'bits-ui';

	type Props = WithChildren<{
		class?: string;
	}>;

	let { children, class: className }: Props = $props();
</script>

<div class={cn('aspect-video w-full rounded-lg border border-border bg-background', className)}>
	<div class="border-b border-inherit p-4">
		<div class="flex items-center gap-2">
			<div class="size-2 rounded-full bg-[#ef4444]"></div>
			<div class="size-2 rounded-full bg-[#eab308]"></div>
			<div class="size-2 rounded-full bg-[#22c55e]"></div>
		</div>
	</div>
	<div class="p-4">
		{@render children?.()}
	</div>
</div>
