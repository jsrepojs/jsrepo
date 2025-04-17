<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import { cn } from '$lib/utils.js';
	import { LoaderCircle } from '@lucide/svelte';

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(''),
		searching = false,
		...restProps
	}: CommandPrimitive.InputProps & { searching?: boolean } = $props();
</script>

<div
	class={cn('flex h-10 items-center border-b px-3 text-base md:text-sm', className)}
	data-command-input-wrapper=""
>
	<Search class="mr-2 size-4 shrink-0 opacity-50" />
	<CommandPrimitive.Input
		class="flex h-full w-full rounded-md bg-transparent py-3 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
		bind:ref
		bind:value
		{...restProps}
	/>
	<div class="absolute right-0 top-0 flex h-12 place-items-center gap-2">
		{#if searching}
			<div class="flex size-full w-12 place-items-center justify-center">
				<LoaderCircle class="size-4 shrink-0 animate-spin text-muted-foreground" />
			</div>
		{/if}
	</div>
</div>
