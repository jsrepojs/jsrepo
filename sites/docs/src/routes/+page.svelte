<script lang="ts">
	import AnimatedGradientText from '$lib/components/animations/animated-gradient-text.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowUpRight } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { Search } from '$lib/components/ui/search';
	import { cn } from '$lib/utils/utils';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';

	const featuredRegistries = [
		'https://reactbits.dev/tailwind',
		'github/ieedan/std',
		'github/ieedan/shadcn-svelte-extras'
	];

	let { data } = $props();

	const { form, submitting, enhance, errors } = superForm(data.form);

	let invalid = $state(false);
	let invalidTimeout = $state<ReturnType<typeof setTimeout>>();

	let focusedIndex = $state(0);
	let sightRef = $state<HTMLDivElement>();
	let headingRef = $state<HTMLHeadingElement>();

	errors.subscribe((v) => {
		if (invalidTimeout) {
			clearTimeout(invalidTimeout);
		}

		// we do this after the below effect runs after submit
		setTimeout(() => {
			if (v.search) {
				invalid = true;
			}
		}, 0);
	});

	// reset invalid once the user types
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$form.search;

		untrack(() => (invalid = false));
	});

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

				<div class="w-full flex place-items-center justify-center pt-2 md:pt-6">
					<form
						method="POST"
						use:enhance
						class="w-full flex place-items-center justify-center max-w-2xl"
					>
						<Search
							bind:value={$form.search}
							disabled={$submitting}
							name="search"
							spellcheck="false"
							autocorrect="off"
							placeholder="Enter a registry url..."
							searching={$submitting}
							searchingText={[
								'Fetching manifest',
								'Compiling information',
								'Doubling efforts',
								'Just a bit longer',
								'Getting concerned now',
								'Asking ChatGPT for help'
							]}
							class={cn({ 'border-destructive': invalid })}
						/>
					</form>
				</div>

				<div class="flex place-items-center justify-center py-2 sm:py-5">
					<div class="flex place-items-center gap-2">
						<Button href="/docs">Get Started</Button>
						<Button href="/demos" variant="outline">See Demos</Button>
					</div>
				</div>
			</div>
		</div>

		<div class="-mt-40 w-full flex place-items-center justify-center">
			<div class="w-full max-w-4xl flex flex-col gap-12 place-items-center justify-center">
				<h2 class="text-4xl font-semibold">Registries</h2>
				<div class="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
					<div class="flex flex-col gap-2 w-full">
						<h3 class="text-xl font-medium">Featured</h3>
						<div class="border-border border rounded-md w-full overflow-hidden">
							<ul class="flex flex-col">
								{#each featuredRegistries as registry}
									<li class="odd:bg-accent/75">
										<a
											href="/registry?url={registry}"
											class="flex place-items-center last:border-b-0 border-b hover:underline p-3 hover:bg-accent"
										>
											{registry}
										</a>
									</li>
								{/each}
							</ul>
						</div>
					</div>
					<div class="flex flex-col gap-2 w-full">
						<h3 class="text-xl font-medium">Trending</h3>
						<div class="border-border border rounded-md w-full overflow-hidden">
							<ul class="flex flex-col">
								{#each data.popular as registry}
									<li class="odd:bg-accent/75">
										<a
											href="/registry?url={registry}"
											class="flex place-items-center last:border-b-0 border-b hover:underline p-3 hover:bg-accent"
										>
											{registry}
										</a>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
