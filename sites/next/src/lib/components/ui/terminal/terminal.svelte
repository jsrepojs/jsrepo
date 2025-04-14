<!--
	Installed from github/ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { Window } from '$lib/components/ui/window';
	import { cn } from '$lib/utils/utils';
	import type { WithChildren } from 'bits-ui';
	import { useTerminalRoot } from './terminal.svelte.js';
	import { onMount } from 'svelte';

	type Props = WithChildren<{
		class?: string;
		delay?: number;
		speed?: number;
		onComplete?: () => void;
	}>;

	let { delay = 0, speed = 1, onComplete = () => {}, children, class: className }: Props = $props();

	const terminal = useTerminalRoot({ delay, speed, onComplete });

	onMount(() => {
		// we play here so that we don't play before it is visible (on the server)
		terminal.play();

		return () => {
			terminal.dispose();
		};
	});
</script>

<Window class={cn('font-mono', className)}>
	{@render children?.()}
</Window>
