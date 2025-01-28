<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import Check from 'lucide-svelte/icons/check';
	import Copy from 'lucide-svelte/icons/copy';
	import { scale } from 'svelte/transition';

	type Props = {
		text: string;
		class?: string;
	};

	let { text, class: className }: Props = $props();

	let copied = $state(false);

	const copy = async () => {
		await navigator.clipboard.writeText(text);

		copied = true;

		setTimeout(() => {
			copied = false;
		}, 750);
	};
</script>

<div class={cn('flex place-items-center justify-center', className)}>
	<Button onclick={copy} variant="ghost" size="icon" class="size-6 text-xs">
		<span class="sr-only">Copy</span>
		{#if copied}
			<div in:scale={{ start: 0.85 }}>
				<Check class="size-3" tabindex={-1} />
			</div>
		{:else}
			<div in:scale={{ start: 0.85 }}>
				<Copy class="size-3" tabindex={-1} />
			</div>
		{/if}
	</Button>
</div>
