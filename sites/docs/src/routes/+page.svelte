<script lang="ts">
	import AnimatedGradientText from '$lib/components/animations/animated-gradient-text.svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils/utils';
	import { ArrowUpRight } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let focusedIndex = $state(0);
	let sightRef = $state<HTMLDivElement>();
	let headingRef = $state<HTMLHeadingElement>();

	const focusIndex = () => {
		if (!headingRef || !sightRef) return;

		const children = Array.from(headingRef.children) as HTMLSpanElement[];

		// reset all
		for (const child of children) {
			child.setAttribute('data-focused', 'false');
		}

		const child = children[focusedIndex];

		const x = child.offsetLeft;
		const y = child.offsetTop;

		const width = child.offsetWidth;
		const height = child.offsetHeight;

		const paddingY = 2;
		const paddingX = 8;

		sightRef.style.width = `${width + paddingX * 2}px`;
		sightRef.style.height = `${height + paddingY * 2}px`;
		sightRef.style.top = `${y - paddingY}px`;
		sightRef.style.left = `${x - paddingX}px`;

		child.setAttribute('data-focused', 'true');
	};

	const loopIncrement = (val: number, max: number) => {
		if (val >= max) return 0;

		return val + 1;
	};

	let mounted = $state(false);

	onMount(() => {
		focusIndex();

		mounted = true;

		const interval = setInterval(() => {
			focusedIndex = loopIncrement(focusedIndex, 2);

			focusIndex();
		}, 3000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<svelte:head>
	<title>jsrepo ~ Home</title>
	<meta
		name="description"
		content="The best way to share your code across projects in the js ecosystem."
	/>
</svelte:head>

<svelte:window onresize={focusIndex} />

<main class="flex place-items-center justify-center w-full px-4 pb-10">
	<div class="w-full">
		<div
			class="flex flex-col gap-5 justify-center place-items-center w-full min-h-[calc(100vh-3.5rem)]"
		>
			<AnimatedGradientText href="/docs/cli/update#%E2%9C%A8%20Update%20with%20AI%20%E2%9C%A8">
				Introducing | Update with AI <ArrowUpRight
					class="size-3 mb-0.5 text-muted-foreground inline"
				/>
			</AnimatedGradientText>

			<div class="relative">
				<h1 bind:this={headingRef} class="text-3xl sm:text-6xl lg:text-7xl text-nowrap font-bold">
					<span
						data-focused={true}
						class="data-[focused=true]:text-primary transition-colors duration-1000 text-muted-foreground"
					>
						Write.
					</span>
					<span
						class="data-[focused=true]:text-primary transition-colors duration-1000 text-muted-foreground"
					>
						Build.
					</span>
					<span
						class="data-[focused=true]:text-primary transition-colors duration-1000 text-muted-foreground"
					>
						Distribute.
					</span>
				</h1>

				<div
					bind:this={sightRef}
					data-visible={mounted}
					class="border-2 absolute border-primary transition-all duration-1000 data-[visible=false]:opacity-0"
				></div>

				<div class="flex place-items-center justify-center mt-2 sm:mt-8">
					<div
						class="border border-border sm:text-lg rounded-md px-2 py-2 font-mono text-muted-foreground w-[250px] flex place-items-center gap-2"
					>
						<div class="select-none">$</div>
						<code>
							<span class="text-primary">jsrepo</span>
							<span class="h-[24px] sm:h-[28px] relative inline-flex flex-col overflow-hidden">
								<div
									class={cn('flex flex-col transition-transform duration-1000', {
										'-translate-y-0': focusedIndex == 0,
										'-translate-y-[24px] sm:-translate-y-[28px]': focusedIndex == 1,
										'-translate-y-[48px] sm:-translate-y-[56px]': focusedIndex == 2
									})}
								>
									<span>init</span>
									<span>build</span>
									<span>add</span>
								</div>
							</span>
						</code>
					</div>
				</div>

				<div class="flex place-items-center justify-center py-2 sm:py-5">
					<div class="flex place-items-center gap-2">
						<Button href="/docs">Get Started</Button>
						<Button href="/demos" variant="outline">See Demos</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
