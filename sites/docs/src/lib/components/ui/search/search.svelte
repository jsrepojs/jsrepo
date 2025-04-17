<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { LoaderCircle, Search } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		value?: string;
		searching?: boolean;
		placeholder?: string;
		/** Debounce for the `oninput` event */
		onDebounce?: (value: string) => void;
		/** Time before `onDebounce` fires */
		debounceMs?: number;
	}

	let {
		value = $bindable(''),
		searching = false,
		placeholder,
		class: className,
		onDebounce,
		debounceMs = 250,
		disabled,
		...rest
	}: Props = $props();

	let debounceTimeout = $state<ReturnType<typeof setTimeout>>();

	const debounce = () => {
		clearTimeout(debounceTimeout);

		debounceTimeout = setTimeout(() => {
			onDebounce?.(value);
		}, debounceMs);
	};

	onMount(() => {
		return () => {
			clearTimeout(debounceTimeout);
		};
	});
</script>

<search
	aria-disabled={disabled}
	class={cn(
		'relative flex h-12 w-full place-items-center gap-2 rounded-xl border border-border pl-2 ring-offset-2 ring-offset-background transition-all focus-within:ring-2 focus-within:ring-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-90',
		className
	)}
>
	<Search class="size-5 shrink-0 text-muted-foreground" />
	<input
		{...rest}
		type="text"
		bind:value
		class="h-full w-full grow bg-transparent outline-none placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
		{placeholder}
		{disabled}
		oninput={debounce}
	/>
	<div class="absolute right-0 top-0 flex h-12 place-items-center gap-2">
		{#if searching}
			<div class="flex size-full w-12 place-items-center justify-center">
				<LoaderCircle class="size-5 shrink-0 animate-spin text-muted-foreground" />
			</div>
		{/if}
	</div>
</search>
