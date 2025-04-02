<script lang="ts">
	import { Search } from '$lib/components/ui/search';
	import { cn } from '$lib/utils/utils';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';

	let { children, data } = $props();

	const { form, submitting, enhance, errors } = superForm(data.form);

	let invalid = $state(false);
	let invalidTimeout = $state<ReturnType<typeof setTimeout>>();

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

<div class="w-full border-b py-2 px-4 flex place-items-center justify-center">
	<form method="POST" use:enhance class="w-full flex place-items-center justify-center max-w-7xl">
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
</div>
<div class="min-h-[calc(100vh-120px)] flex flex-col place-items-center w-full px-4">
	{@render children?.()}
</div>
