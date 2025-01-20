<script lang="ts">
	import type { HTMLVideoAttributes } from 'svelte/elements';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Clapperboard, Pause, Play } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import { dev } from '$app/environment';
	import * as math from '$lib/utils/math';

	interface Props extends HTMLVideoAttributes {
		hideSkeleton?: boolean;
		ref?: HTMLVideoElement;
		paused?: boolean;
		loading?: boolean;
		src: string;
		/** Required for preloading so that there is no layout shift @default 16:9 */
		aspectRatio?: number | '16:9' | '9:16' | '4:3' | '3:2' | '21:9';
	}

	let {
		ref = $bindable(),
		paused = $bindable(),
		loading = $bindable(true),
		hideSkeleton = false,
		src,
		autoplay,
		aspectRatio,
		controls = false,
		...rest
	}: Props = $props();

	let height = $state(0);
	let width = $state(0);
	let duration = $state();

	const togglePlay = () => {
		if (ref?.paused) {
			ref?.play();
		} else {
			ref?.pause();
		}
	};

	const solveAspectRatio = (ar: Props['aspectRatio']) => {
		if (!ar) return 16 / 9; // default to 16:9

		if (typeof ar === 'number') return ar;

		const [width, height] = ar.split(':');

		return parseFloat(width) / parseFloat(height);
	};

	$effect(() => {
		if (!duration) return;

		loading = false;
	});
</script>

<div
	class="relative group w-full"
	style="aspect-ratio: {loading ? solveAspectRatio(aspectRatio) : 'auto'};"
>
	{#if loading && !hideSkeleton}
		<Skeleton class="h-full w-full" />
		<Clapperboard
			class="size-6 absolute text-muted-foreground top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
		/>
	{/if}
	<video
		bind:this={ref}
		{controls}
		onloadedmetadata={(e) => {
			width = e.currentTarget.videoWidth;
			height = e.currentTarget.videoHeight;
		}}
		onloadeddata={() => {
			loading = false;
			if (autoplay && ref?.paused) ref?.play();
		}}
		{autoplay}
		bind:paused
		class="w-full data-[visible=false]:hidden"
		data-visible={!loading}
		bind:duration
		{...rest}
	>
		<source {src} type="video/mp4" />
		<track kind="captions" />
	</video>
	{#if !loading && !controls}
		<button
			onmousedown={togglePlay}
			ontouchstart={togglePlay}
			type="button"
			class="absolute top-0 left-0 w-full h-full flex place-items-center justify-center
            bg-background/25 transition-all group-hover:opacity-100 opacity-0 pointer-events-none
            group-hover:pointer-events-auto text-muted-foreground"
		>
			<div>
				{#if paused}
					<div in:scale={{ start: 0.85 }}>
						<span class="sr-only">Play</span>
						<Play class="size-6" />
					</div>
				{:else}
					<div in:scale={{ start: 0.85 }}>
						<span class="sr-only">Pause</span>
						<Pause class="size-6" />
					</div>
				{/if}
			</div>
		</button>
	{/if}
	{#if dev && aspectRatio === undefined && width !== 0 && height !== 0}
		<div class="absolute p-2 bg-background top-0 right-0 flex flex-col place-items-end">
			<span class="text-xs text-muted-foreground">{width}x{height}</span>
			<span class="text-lg font-medium">{math.fractions.simplify(width, height).join(':')}</span>
		</div>
	{/if}
</div>
