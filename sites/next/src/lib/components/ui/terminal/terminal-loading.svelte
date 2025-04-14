<!--
	Installed from github/ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { onDestroy } from 'svelte';
	import { useAnimation } from './terminal.svelte.js';
	import type { TerminalAnimationProps } from './types';
	import { fly } from 'svelte/transition';

	const frames = ['◒', '◐', '◓', '◑'];
	const check = '✔';

	let {
		delay = 0,
		loadingMessage,
		completeMessage,
		duration = 1000,
		class: className
	}: Omit<TerminalAnimationProps, 'children'> & {
		loadingMessage: string;
		completeMessage: string;
		duration?: number;
	} = $props();

	let playAnimation = $state(false);
	let animationSpeed = $state(1);
	let frameIndex = $state(0);
	let complete = $state(false);
	let interval = $state<ReturnType<typeof setInterval>>();
	let timeout = $state<ReturnType<typeof setTimeout>>();

	const play = (speed: number) => {
		playAnimation = true;
		animationSpeed = speed;

		interval = setInterval(nextFrame, 100 / animationSpeed);
		timeout = setTimeout(() => {
			complete = true;
			animation.onComplete?.();
		}, duration / animationSpeed);
	};

	const nextFrame = () => {
		if (frameIndex >= frames.length - 1) {
			frameIndex = 0;
			return;
		}

		frameIndex++;
	};

	const flyDuration = $derived(300 / animationSpeed);

	const animation = useAnimation({ delay, play });

	onDestroy(() => {
		animation.dispose();
		clearInterval(interval);
		clearTimeout(timeout);
	});
</script>

{#if playAnimation && !complete}
	<span class={cn('block', className)} in:fly={{ y: -5, duration: flyDuration }}>
		<span>{frames[frameIndex]}</span>
		{loadingMessage}
	</span>
{:else if playAnimation}
	<span class={cn('block', className)} data-completed in:fly={{ y: -5, duration: flyDuration }}>
		{check}
		{completeMessage}
	</span>
{/if}
