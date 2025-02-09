<!--
	jsrepo 1.34.0
	Installed from github/shyakadavis/geist
	2-9-2025
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		title?: string;
		class?: string | null;
		children?: Snippet;
	};

	let { class: class_name = undefined, title, children, ...rest }: Props = $props();
</script>

<div class={cn('flex flex-col rounded-md border bg-background', class_name)} {...rest}>
	<div class="relative flex h-9 w-full border-b border-inherit px-2">
		<div class="flex place-items-center gap-2">
			<span class="size-2 rounded-full bg-[#ff5f56]"></span>
			<span class="size-2 rounded-full bg-[#ffbd2e]"></span>
			<span class="size-2 rounded-full bg-[#27c93f]"></span>
		</div>
		{#if title}
			<p
				class="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] text-xs text-muted-foreground"
			>
				{title}
			</p>
		{/if}
	</div>
	<div class="flex-grow">
		{@render children?.()}
	</div>
</div>
