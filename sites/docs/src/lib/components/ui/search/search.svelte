<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { LoaderCircle, Search } from 'lucide-svelte';
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
		return () => clearTimeout(debounceTimeout);
	});
</script>

<search
	class={cn(
		'relative border border-border rounded-xl flex place-items-center gap-2 pl-2 h-12 w-full max-w-2xl focus-within:ring-2 ring-offset-2 ring-offset-background focus-within:ring-primary transition-all',
		className
	)}
>
	<Search class="text-muted-foreground size-5 shrink-0" />
	<input
		{...rest}
		type="text"
		bind:value
		class="grow w-full bg-transparent outline-none focus:outline-none h-full placeholder:text-muted-foreground"
		{placeholder}
		oninput={debounce}
	/>
	<div class="absolute size-12 right-0 top-0">
		{#if searching}
			<div class="flex place-items-center justify-center size-full">
				<LoaderCircle class="size-5 shrink-0 text-muted-foreground animate-spin" />
			</div>
		{/if}
	</div>
</search>
