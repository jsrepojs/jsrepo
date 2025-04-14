<!--
	Installed from github/ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { onDestroy } from 'svelte';
	import { useAnimation } from './terminal.svelte.js';
	import type { TerminalAnimationProps } from './types';
	import { typewriter } from '$lib/actions/typewriter.svelte';

	let { children, delay = 0, class: className }: TerminalAnimationProps = $props();

	let playAnimation = $state(false);
	let animationSpeed = $state(1);

	const play = (speed: number) => {
		playAnimation = true;
		animationSpeed = speed;
	};

	const animation = useAnimation({ delay, play });

	onDestroy(() => animation.dispose());
</script>

{#if playAnimation}
	<span
		class={cn('block', className)}
		transition:typewriter={{
			speed: animationSpeed * 2,
			onComplete: () => animation.onComplete?.()
		}}
	>
		{@render children?.()}
	</span>
{/if}
