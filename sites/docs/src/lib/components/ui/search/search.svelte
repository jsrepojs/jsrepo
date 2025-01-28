<script lang="ts">
	import { Flip } from '$lib/components/animations/flip';
	import { cn } from '$lib/utils/utils';
	import { LoaderCircle, Search } from 'lucide-svelte';
	import { onMount, untrack } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		value?: string;
		searching?: boolean;
		searchingText?: string[];
		placeholder?: string;
		/** Debounce for the `oninput` event */
		onDebounce?: (value: string) => void;
		/** Time before `onDebounce` fires */
		debounceMs?: number;
	}

	let {
		value = $bindable(''),
		searching = false,
		searchingText,
		placeholder,
		class: className,
		onDebounce,
		debounceMs = 250,
		disabled,
		...rest
	}: Props = $props();

	let debounceTimeout = $state<ReturnType<typeof setTimeout>>();
	let flipIndex = $state(0);

	const incrementLoop = (index: number, max: number) => {
		if (index >= max) return 0;

		return index + 1;
	};

	let loopInterval = $state<ReturnType<typeof setInterval>>();

	$effect(() => {
		if (searching) {
			untrack(() => {
				if (!searchingText) return;

				clearInterval(loopInterval);

				loopInterval = setInterval(() => {
					if (searchingText) {
						flipIndex = incrementLoop(flipIndex, searchingText?.length - 1);
					}
				}, 5000);
			});
		} else {
			untrack(() => {
				if (loopInterval) {
					clearInterval(loopInterval);
				}
			});
		}
	});

	const debounce = () => {
		clearTimeout(debounceTimeout);

		debounceTimeout = setTimeout(() => {
			onDebounce?.(value);
		}, debounceMs);
	};

	onMount(() => {
		return () => {
			clearTimeout(debounceTimeout);
			clearInterval(loopInterval);
		};
	});
</script>

<search
	aria-disabled={disabled}
	class={cn(
		'relative aria-disabled:cursor-not-allowed aria-disabled:opacity-90 border border-border rounded-xl flex place-items-center gap-2 pl-2 h-12 w-full focus-within:ring-2 ring-offset-2 ring-offset-background focus-within:ring-primary transition-all',
		className
	)}
>
	<Search class="text-muted-foreground size-5 shrink-0" />
	<input
		{...rest}
		type="text"
		bind:value
		class="grow w-full disabled:cursor-not-allowed bg-transparent outline-none focus:outline-none h-full placeholder:text-muted-foreground"
		{placeholder}
		{disabled}
		oninput={debounce}
	/>
	<div class="absolute right-0 top-0 h-12 flex place-items-center gap-2">
		{#if searching}
			{#if searchingText}
				<Flip
					class="text-muted-foreground text-xs text-right hidden sm:block"
					height={16}
					index={flipIndex}
					items={searchingText}
				/>
			{/if}
			<div class="flex place-items-center justify-center size-full w-12">
				<LoaderCircle class="size-5 shrink-0 text-muted-foreground animate-spin" />
			</div>
		{/if}
	</div>
</search>
