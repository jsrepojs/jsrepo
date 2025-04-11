<script lang="ts">
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import NavMenu from './docs/nav-menu.svelte';
	import StarButton from './star-button.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Menu, X } from '@lucide/svelte';

	let { stars }: { stars: Promise<number> } = $props();

	let menuOpen = $state(false);
</script>

<header
	class="fixed left-0 top-0 z-10 flex h-[--header-height] w-full items-center border-b bg-background"
>
	<div class="container flex items-center justify-between">
		<div>
			<a
				href="/"
				class="flex h-9 w-fit place-items-center justify-center bg-brand p-1 font-mono font-bold text-brand-foreground"
			>
				jsrepo
			</a>
		</div>

		<div class="flex place-items-center gap-2">
			<StarButton {stars} class="hidden md:flex"/>
			<LightSwitch class="size-9 hidden md:flex" />
			<Button class="md:hidden" size="icon" variant="ghost" onclick={() => (menuOpen = !menuOpen)}>
				{#if menuOpen}
					<X />
				{:else}
					<Menu />
				{/if}
			</Button>
		</div>
	</div>
</header>

<NavMenu bind:open={menuOpen} />
