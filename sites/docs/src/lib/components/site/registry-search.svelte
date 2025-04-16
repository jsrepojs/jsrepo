<script lang="ts">
	import { UseQuery } from '$lib/hooks/use-query.svelte.js';
	import { goto } from '$app/navigation';
	import { activeElement } from 'runed';
	import { debounced } from '$lib/ts/debounced.js';
	import type { RegistryResponse } from '../../../routes/api/registries/types';
	import { cn } from '$lib/utils';
	import { selectProvider } from 'jsrepo';
	import { LoaderCircle, Plus, Search } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { getIcon } from '$lib/ts/registry/client';

	type Props = {
		class?: string;
		search?: string;
		onSearch?: (search: string) => void;
	};

	let { search = $bindable(''), onSearch, class: className }: Props = $props();

	let searching = $state(false);
	let completions: string[] = $state([]);

	const query = new UseQuery(async ({ signal, isAborted }) => {
		if (search === '') {
			searching = false;
			completions = [];
			return;
		}

		searching = true;

		try {
			const response = await fetch(`/api/registries?limit=3&query=${search}&with_data=false`, {
				signal
			});

			if (!response.ok) return;

			const data = (await response.json()) as RegistryResponse;

			completions = data.registries.map((r) => r.url);

			// searching isn't in a finally block because we still want to show loading for the newer request
			searching = false;
		} catch (err) {
			if (!isAborted(err)) {
				searching = false;
			}
		}
	});

	const debouncedQuery = $derived(debounced(query.query, 100));

	const filteredCompletions = $derived(
		completions.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
	);

	let adding = $state(false);
	let error = $state<string>();

	// resets when search changes
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		search;

		untrack(() => {
			error = undefined;
			selectedIndex = undefined;
		});
	});

	async function addRegistry(url: string) {
		adding = true;

		try {
			const response = await fetch('/api/registries', {
				method: 'POST',
				body: JSON.stringify({ url })
			});

			if (!response.ok) {
				error = `${response.status} ${response.statusText}`;

				return;
			}

			await goto(`/registries/${url}`);
		} catch (err) {
			error = err as string;
		} finally {
			adding = false;
		}
	}

	let selectedIndex = $state<number>();

	const isFocused = $derived(
		activeElement.current?.id === 'search-registries' || selectedIndex !== undefined
	);
	const canAdd = $derived(filteredCompletions.length === 0 && !searching && search.length > 0);

	const canShowList = $derived(
		isFocused &&
			search.length > 0 &&
			(filteredCompletions.length > 0 || selectProvider(search) !== undefined)
	);

	function handleKeydown(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		let length = filteredCompletions.length;

		if (canAdd) {
			// only the `add` option
			length = 1;
		}

		if (length === 0) return;

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (selectedIndex === undefined) return;

			if (selectedIndex - 1 < 0) {
				return;
			}

			selectedIndex -= 1;

			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();

			if (selectedIndex === undefined) {
				selectedIndex = 0;

				return;
			}

			if (selectedIndex + 1 > filteredCompletions.length - 1) {
				selectedIndex = 0;
			} else {
				selectedIndex += 1;
			}

			return;
		}

		if (e.key === 'Escape') {
			selectedIndex = undefined;
		}
	}

	async function handleSubmit() {
		if (selectedIndex === undefined) {
			if (search.trim().length === 0) return;

			if (onSearch !== undefined) {
				onSearch(search);
			} else {
				await goto(`/registries/search?query=${search}`);
			}
		} else {
			if (canAdd) {
				await addRegistry(search);

				return;
			}

			const options = document.querySelectorAll(`[data-search-item]`);

			for (const option of options) {
				const index = parseInt(option.getAttribute('data-index') ?? '-1');

				if (index === selectedIndex) {
					const url = option.getAttribute('data-url');

					if (!url) return;

					await goto(`/registries/${url}`);
				}
			}
		}

		// reset completions so that they don't show on refresh
		completions = [];
	}
</script>

<svelte:window
	onclick={(e) => {
		// if we click outside make sure we clear the selected index
		const target = e.target as HTMLElement | null;

		if (!target) return;

		if (!target.hasAttribute('data-search-item')) {
			selectedIndex = undefined;
		}
	}}
/>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	class={cn('flex h-12 w-full place-items-center bg-popover text-base md:text-sm', className)}
>
	<div
		class="relative flex h-full w-full place-items-center rounded-l-lg border border-border pl-3"
	>
		<Search class="mr-2 size-4 shrink-0 opacity-50" />
		<input
			id="search-registries"
			bind:value={search}
			autocomplete="off"
			onclick={() => (selectedIndex = undefined)}
			oninput={() => debouncedQuery()}
			onkeydown={handleKeydown}
			class="h-full w-full min-w-0 bg-transparent py-3 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
			placeholder="Search registries..."
			disabled={adding}
		/>
		<div class="absolute right-0 top-0 flex h-12 place-items-center gap-2">
			{#if searching}
				<div class="flex size-full w-12 place-items-center justify-center">
					<LoaderCircle class="size-4 shrink-0 animate-spin text-muted-foreground" />
				</div>
			{/if}
			{#if error}
				<div class="flex size-full w-12 place-items-center justify-center text-red-400">!</div>
			{/if}
		</div>
		{#if canShowList}
			<div
				class="absolute left-0 top-[3.25rem] z-10 w-full rounded-lg border border-border bg-popover"
			>
				<!-- Group -->
				<div class="overflow-hidden p-1 text-foreground">
					{#each filteredCompletions as url, i (url)}
						{@const Icon = getIcon(url)}
						<!-- svelte-ignore a11y_mouse_events_have_key_events -->
						<!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
						<button
							type="submit"
							class="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
							aria-selected={selectedIndex === i}
							onmouseover={() => (selectedIndex = i)}
							tabindex={-1}
							data-search-item
							data-index={i}
							data-url={url}
						>
							<Icon />
							{url}
						</button>
					{/each}
					{#if filteredCompletions.length === 0 && !searching && search.length > 0}
						{#if selectProvider(search) !== undefined}
							<!-- svelte-ignore a11y_mouse_events_have_key_events -->
							<!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
							<button
								type="submit"
								class="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
								aria-selected={selectedIndex === 0}
								onmouseover={() => (selectedIndex = 0)}
								data-search-item
								tabindex={-1}
								data-index={0}
							>
								<Plus />
								Add {search}
							</button>
						{/if}
					{/if}
				</div>
			</div>
		{/if}
	</div>
	<button
		type="submit"
		class="h-full rounded-r-lg border border-primary bg-primary px-4 text-primary-foreground"
	>
		Search
	</button>
</form>
