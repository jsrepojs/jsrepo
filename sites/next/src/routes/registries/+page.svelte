<script lang="ts">
	import SectionLabel from '$lib/components/site/section-label.svelte';
	import { Search } from '$lib/components/ui/search/index.js';
	import { getIcon } from '$lib/ts/registry/client.js';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms/client';

	let { data } = $props();

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

<svelte:head>
	<title>jsrepo ~ Registries</title>
	<meta name="description" content="Discover and search jsrepo registries" />
</svelte:head>

{#snippet registryIcon({ url }: { url: string })}
	{@const Icon = getIcon(url)}
	<Icon class="size-5 shrink-0" />
{/snippet}

<main class="relative pt-[--header-height]">
	<div class="mt-[25vh] flex flex-col place-items-center">
		<form method="POST" class="w-full max-w-2xl" use:enhance>
			<Search
				placeholder="Search registries"
				name="search"
				autocomplete="off"
				searching={$submitting}
				bind:value={$form.search}
			/>
			<button type="submit" class="hidden"> Submit </button>
		</form>
		<div class="mt-36 grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
			<div class="flex flex-col gap-2">
				<SectionLabel>Most Popular</SectionLabel>
				<ol class="col-start-1 flex flex-col gap-2">
					{#each data.popular as registry (registry.url)}
						<li class="relative rounded-lg border px-6 py-4 transition-colors hover:bg-accent/50">
							<a href="/registries/{registry.url}" class="flex place-items-center gap-4">
								<span class="absolute inset-0"></span>
								{@render registryIcon({ url: registry.url })}
								{registry.url}
							</a>
						</li>
					{/each}
				</ol>
			</div>

			<div class="flex flex-col gap-2">
				<SectionLabel>featured</SectionLabel>
				<ol class="col-start-2 flex flex-col gap-2">
					{#each data.featured as registry (registry.url)}
						<li class="relative rounded-lg border px-6 py-4 transition-colors hover:bg-accent/50">
							<a href="/registries/{registry.url}" class="flex place-items-center gap-4">
								<span class="absolute inset-0"></span>
								{@render registryIcon({ url: registry.url })}
								{registry.url}
							</a>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</main>
