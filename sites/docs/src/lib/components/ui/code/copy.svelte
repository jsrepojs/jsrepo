<!--
	jsrepo 1.22.1
	Installed from github/ieedan/shadcn-svelte-extras
	12-22-2024
-->

<script lang="ts">
	import { Check, Copy } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { scale } from 'svelte/transition';
	import { cn } from '$lib/utils/utils';

	type Props = {
		class?: string;
		code: string;
	};

	let { code, class: className }: Props = $props();

	let copied = $state(false);

	const copy = async () => {
		await navigator.clipboard.writeText(code);

		copied = true;

		setTimeout(() => {
			copied = false;
		}, 500);
	};
</script>

<Button size="icon" variant="ghost" onclick={copy} class={cn('', className)}>
	{#if copied}
		<div in:scale={{ start: 0.75, duration: 150 }}>
			<Check class="size-4" />
		</div>
	{:else}
		<div in:scale={{ start: 0.75, duration: 150 }}>
			<Copy class="size-4" />
		</div>
	{/if}
</Button>
