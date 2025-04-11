<script lang="ts">
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import StarButton from './star-button.svelte';

	let { stars }: { stars: Promise<number> } = $props();
</script>

<header
	class="fixed left-0 top-0 z-10 flex h-[--header-height] w-full items-center border-b bg-background"
>
	<div class="container flex items-center justify-between">
		<div>
			<a
				href="/"
				class="text-brand-foreground flex h-9 w-fit place-items-center justify-center bg-brand p-1 font-mono font-bold"
			>
				jsrepo
			</a>
		</div>

		<div>
			<StarButton {stars} />
			<LightSwitch class="size-9" />
		</div>
	</div>
</header>
