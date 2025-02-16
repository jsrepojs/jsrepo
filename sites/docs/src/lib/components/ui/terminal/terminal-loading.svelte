<!--
	jsrepo 1.36.0
	Installed from github/ieedan/shadcn-svelte-extras
	2-16-2025
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { onDestroy } from 'svelte';
	import { useAnimation } from './state.svelte';
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
		timeout = setTimeout(() => (complete = true), duration / animationSpeed);
	};

	const nextFrame = () => {
		if (frameIndex >= frames.length - 1) {
			frameIndex = 0;
			return;
		}

		frameIndex++;
	};

	const animation = useAnimation({ delay, play });

	onDestroy(() => {
		animation.dispose();
		clearInterval(interval);
		clearTimeout(timeout);
	});
</script>

{#if playAnimation && !complete}
	<span class={cn('block', className)} in:fly={{ y: -5, duration: 300 / animationSpeed }}>
		<span>{frames[frameIndex]}</span>
		{loadingMessage}
	</span>
{:else if playAnimation}
	<span
		class={cn('block', className)}
		data-completed
		in:fly={{ y: -5, duration: 300 / animationSpeed }}
	>
		{check}
		{completeMessage}
	</span>
{/if}
