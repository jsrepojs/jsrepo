<!--
	Installed from github/ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import type { WithChildren } from 'bits-ui';
	import { onDestroy } from 'svelte';
	import { useTerminalLoop } from './terminal.svelte.js';

	let {
		delay = 500,
		children
	}: WithChildren<{
		delay?: number;
	}> = $props();

	let loopIndex = $state(0);
	let loopDelayTimeout = $state<ReturnType<typeof setTimeout>>();

	const onComplete = () => {
		loopDelayTimeout = setTimeout(() => loopIndex++, delay);
	};

	useTerminalLoop({ onComplete });

	onDestroy(() => clearTimeout(loopDelayTimeout));
</script>

{#key loopIndex}
	{@render children?.()}
{/key}
