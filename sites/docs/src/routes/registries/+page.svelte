<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search } from '$lib/components/ui/search';
	import { cn } from '$lib/utils/utils';
	import { selectProvider } from 'jsrepo';
	import { untrack } from 'svelte';

	let search = $state('');
	let searching = $state(false);
	let invalid = $state(false);

	const provider = $derived(selectProvider(search));

	// reset invalid whenever the user types
	$effect(() => {
		search;

		untrack(() => {
			invalid = false;
		});
	});

	const submit = async () => {
		if (!provider) {
			invalid = true;
			return;
		}

		searching = true;

		await goto(`/registry?url=${search}`);

		searching = false;
	};
</script>

<div class="h-svh w-full flex place-items-center justify-center">
	<form
		onsubmit={(e) => {
			e.preventDefault();

			submit();
		}}
		class="w-full flex place-items-center justify-center"
	>
		<Search
			bind:value={search}
			name="search"
			placeholder="Enter a registry url..."
			{searching}
			class={cn({ 'border-destructive': invalid })}
		/>
	</form>
</div>
