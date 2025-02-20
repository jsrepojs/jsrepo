<script lang="ts">
	import LightSwitch from '$lib/components/ui/light-switch/light-switch.svelte';
	import { Command, Search } from 'lucide-svelte';
	import { active } from '$lib/actions/active.svelte';
	import { StarButton } from '$lib/components/ui/github';
	import { Button } from '$lib/components/ui/button';
	import { Kbd } from '$lib/components/ui/kbd';
	import { commandContext } from '$lib/ts/context';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	type Props = {
		version: string;
		stars: Promise<number>;
	};

	let { version, stars }: Props = $props();

	const commandOpen = commandContext.get();

	const isMobile = new IsMobile();
</script>

<header
	class="py-2 px-4 flex place-items-center justify-center border-b border-border h-14 sticky top-0 bg-background z-40"
>
	<div class="flex place-items-center justify-between w-full">
		<div class="flex place-items-center gap-6">
			{#if isMobile.current}
				<div id="sidebar-trigger-portal-target"></div>
			{:else}
				<a href="/" class="flex place-items-center gap-2">
					<h1 class="bg-primary text-primary-foreground text-lg font-mono font-bold p-1 w-fit">
						jsrepo
					</h1>
					<span class="text-base font-mono text-muted-foreground">v{version}</span>
				</a>
				<nav class="place-items-center gap-4 flex">
					<a
						href="/"
						class="hover:dark:text-primary hover:text-foreground text-muted-foreground transition-all data-[active=true]:text-foreground data-[active=true]:dark:text-primary"
						use:active={{
							activeForSubdirectories: false
						}}
					>
						Home
					</a>
					<a
						href="/docs"
						class="hover:dark:text-primary hover:text-foreground text-muted-foreground transition-all data-[active=true]:text-foreground data-[active=true]:dark:text-primary"
						use:active={{
							activeForSubdirectories: true
						}}
					>
						Docs
					</a>
					<a
						href="/demos"
						class="hover:dark:text-primary hover:text-foreground text-muted-foreground transition-all data-[active=true]:text-foreground data-[active=true]:dark:text-primary"
						use:active={{
							activeForSubdirectories: true
						}}
					>
						Demos
					</a>
				</nav>
			{/if}
		</div>
		<div class="flex place-items-center gap-1">
			<Button
				variant="outline"
				class="flex place-items-center justify-between min-w-48 sm:min-w-56"
				onclick={() => ($commandOpen = true)}
			>
				<span class="text-muted-foreground flex place-items-center gap-2">
					<Search class="size-4" />
					Search
				</span>
				<div class="flex place-items-center gap-1">
					<Kbd class="px-2">
						<Command class="size-4 pr-1" />K
					</Kbd>
				</div>
			</Button>
			<StarButton {stars} />
			<LightSwitch />
		</div>
	</div>
</header>
