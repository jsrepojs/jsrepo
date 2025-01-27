<script lang="ts">
	import { Search } from '$lib/components/ui/search';
	import { cn } from '$lib/utils/utils';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';

	let { data } = $props();

	const { form, submitting, enhance, errors } = superForm(data.form);

	let invalid = $state(false);

	let invalidTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

	errors.subscribe((v) => {
		if (invalidTimeout) {
			clearTimeout(invalidTimeout);
		}

		// we do this after the below effect runs after submit
		setTimeout(() => {
			if (v.search) {
				invalid = true;
			}
		}, 0);
	});

	// reset invalid once the user types
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$form.search;

		untrack(() => (invalid = false));
	});
</script>

<svelte:head>
	<title>jsrepo ~ Registries</title>
</svelte:head>

<div class="h-svh w-full flex flex-col place-items-center justify-center gap-4 px-4">
	<form method="POST" use:enhance class="w-full flex place-items-center justify-center max-w-2xl">
		<Search
			bind:value={$form.search}
			disabled={$submitting}
			name="search"
			spellcheck="false"
			autocorrect="off"
			placeholder="Enter a registry url..."
			searching={$submitting}
			searchingText={[
				'Fetching manifest',
				'Compiling information',
				'Doubling efforts',
				'Just a bit longer',
				'Getting concerned now',
				'Asking ChatGPT for help'
			]}
			class={cn({ 'border-destructive': invalid })}
		/>
	</form>
	<div class="grid grid-cols-3 w-full max-w-2xl">
		<div class="flex flex-col gap-2">
			<!-- {#each data.searchedRegistries as reg}
				<a href="/registry?url={reg.slice(9)}">{reg.slice(9)}</a>
			{/each} -->
		</div>
	</div>
</div>
