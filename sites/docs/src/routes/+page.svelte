<script lang="ts">
	import AnimatedGradientText from '$lib/components/animations/animated-gradient-text.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowUpRight } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { Search } from '$lib/components/ui/search';
	import { cn } from '$lib/utils/utils';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import Marquee from '$lib/components/animations/marquee/marquee.svelte';
	import * as Icons from '$lib/components/icons';
	import * as Terminal from '$lib/components/ui/terminal';

	const featuredRegistries = [
		'github/ieedan/shadcn-svelte-extras',
		'github/ieedan/std',
		'github/shyakadavis/geist',
		'https://reactbits.dev/tailwind',
		'https://reactbits.dev/ts/tailwind'
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
				<p class="text-muted-foreground text-lg text-center mt-4">
					<span
						class={{ 'text-primary': focusedIndex === 0, 'transition-colors duration-1000': true }}
					>
						Write
					</span>
					your code,
					<span
						class={{ 'text-primary': focusedIndex === 1, 'transition-colors duration-1000': true }}
					>
						Build
					</span>
					it into a registry, and
					<span
						class={{ 'text-primary': focusedIndex === 2, 'transition-colors duration-1000': true }}
					>
						Distribute
					</span> it through the CLI.
				</p>

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
						<h3 class="text-xl font-medium">Most Popular</h3>
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

		<div class="mt-20 w-full flex flex-col place-items-center justify-center">
			<div class="flex flex-col lg:flex-row place-items-center w-full justify-center gap-6">
				<div class="lg:max-w-sm text-center lg:text-left">
					<h3 class="text-4xl font-bold">Move quickly</h3>
					<p class="text-muted-foreground">
						With unified build tooling theres no need to write any scripts.
					</p>
				</div>
				<Terminal.Loop delay={750}>
					<Terminal.Root class="max-w-xl min-h-[250px] font-mono text-sm">
						<Terminal.TypingAnimation>&gt; jsrepo build</Terminal.TypingAnimation>
						<Terminal.Loading
							delay={1000}
							class="text-blue-400 data-[completed]:text-green-500"
							loadingMessage="Building ./src"
							completeMessage="Built ./src"
						/>
						<Terminal.AnimatedSpan delay={2400} class="text-green-500">
							✔ Completed checking manifest.
						</Terminal.AnimatedSpan>
						<br />
						<Terminal.AnimatedSpan delay={2750}>
							<pre><span class="text-yellow-400">Preview</span>:
	◻ utils/array
	◻ utils/string</pre>
						</Terminal.AnimatedSpan>
						<br />
						<Terminal.AnimatedSpan delay={3000} class="text-green-500"
							>✔ All done.</Terminal.AnimatedSpan
						>
					</Terminal.Root>
				</Terminal.Loop>
			</div>
		</div>

		<div class="mt-20 w-full flex flex-col place-items-center justify-center">
			<div class="flex flex-col lg:flex-row place-items-center w-full justify-center gap-6">
				<Terminal.Loop delay={750}>
					<Terminal.Root class="max-w-xl min-h-[250px] font-mono text-sm order-2 lg:order-1">
						<Terminal.TypingAnimation>&gt; jsrepo add ui/button</Terminal.TypingAnimation>
						<Terminal.Loading
							delay={1500}
							class="text-blue-400 data-[completed]:text-green-500"
							loadingMessage="Fetching blocks from github/ieedan/shadcn-svelte-extras"
							completeMessage="Retrieved blocks from github/ieedan/shadcn-svelte-extras"
						/>
						<Terminal.Loading
							delay={2750}
							class="text-blue-400 data-[completed]:text-green-500"
							loadingMessage="Adding ui/button"
							completeMessage="Added ui/button, utils/utils"
						/>
						<Terminal.Loading
							delay={4000}
							class="text-blue-400 data-[completed]:text-green-500"
							loadingMessage="Installing dependencies"
							completeMessage="Installed clsx@^2.1.1 tailwind-merge@^2.6.0 lucide-svelte@^0.475.0 bits-ui@^1.1.0 tailwind-variants@^0.3.1"
						/>
						<Terminal.AnimatedSpan delay={5250} class="text-green-500"
							>✔ All done.</Terminal.AnimatedSpan
						>
					</Terminal.Root>
				</Terminal.Loop>
				<div class="lg:max-w-sm text-center lg:text-left order-1 lg:order-2">
					<h3 class="text-4xl font-bold">Add from anywhere</h3>
					<p class="text-muted-foreground">
						Github, GitLab, BitBucket, Azure, or even custom urls!
					</p>
				</div>
			</div>
		</div>

		<div class="mt-20 w-full flex flex-col place-items-center justify-center">
			<div class="flex flex-col lg:flex-row place-items-center w-full justify-center gap-6">
				<div class="lg:max-w-sm text-center lg:text-left">
					<h3 class="text-4xl font-bold">Update with confidence</h3>
					<p class="text-muted-foreground">View changes before they're part of your codebase.</p>
				</div>
				<Terminal.Loop delay={750}>
					<Terminal.Root
						class="max-w-xl h-[400px] font-mono text-sm order-2 overflow-hidden lg:order-1"
					>
						<Terminal.TypingAnimation>&gt; jsrepo update ui/button</Terminal.TypingAnimation>
						<Terminal.Loading
							delay={1500}
							class="text-blue-400 data-[completed]:text-green-500"
							loadingMessage="Fetching blocks from github/ieedan/shadcn-svelte-extras"
							completeMessage="Retrieved blocks from github/ieedan/shadcn-svelte-extras"
						/>
						<Terminal.AnimatedSpan delay={2750}>
							github/ieedan/shadcn-svelte-extras/ui/button
						</Terminal.AnimatedSpan>
						<Terminal.AnimatedSpan delay={3000}>
							<pre><span class="text-muted-foreground"
									>{`      + 20 more unchanged (-E to expand)`}</span
								>{`
  21                           link: 'text-primary underline-offset-4 hover:underline'
  22                   },
  23                   size: {`}
<span
									>{`  24                           default: 'h-10 `}px-<span class="bg-green-400"
										>3</span
									><span class="bg-red-400">4</span> py-2',</span
								>
{`  25                           sm: 'h-9 rounded-md px-3',
  26                           lg: 'h-11 rounded-md px-8',
  27                           icon: 'h-10 w-10'`}
<span class="text-muted-foreground">{`      + 60 more unchanged (-E to expand)`}</span></pre>
						</Terminal.AnimatedSpan>
						<Terminal.Loading
							delay={3250}
							class="text-blue-400 data-[completed]:text-green-500"
							loadingMessage="Installing dependencies"
							completeMessage="Installed bits-ui@^1.1.0"
						/>
						<Terminal.AnimatedSpan delay={4500} class="text-green-500">
							✔ All done.
						</Terminal.AnimatedSpan>
					</Terminal.Root>
				</Terminal.Loop>
			</div>
		</div>

		<div class="w-full flex flex-col place-items-center justify-center mt-20">
			<div class="py-4 text-center">
				<h3 class="text-4xl font-bold">Use what YOU use</h3>
				<p class="text-muted-foreground">And let jsrepo do the rest.</p>
			</div>
			<div
				class="relative flex h-full w-full max-w-lg flex-col items-center justify-center overflow-hidden"
			>
				<Marquee class="w-full [--duration:16s]" repeat={10}>
					<Icons.TypeScript class="size-11 mx-2" />
					<Icons.Svelte class="size-11 mx-2" />
					<Icons.React class="size-11 mx-2" />
					<Icons.Vue class="size-11 mx-2" />
					<Icons.CSS class="size-11 mx-2" />
					<Icons.HTML class="size-11 mx-2" />
					<Icons.JavaScript class="size-11 mx-2" />
					<Icons.SASS class="size-11 mx-2" />
					<Icons.Yaml class="size-11 mx-2" />
					<Icons.Svg class="size-11 mx-2" />
				</Marquee>
				<div
					class="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background"
				></div>
				<div
					class="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background"
				></div>
			</div>
		</div>

		<div class="mt-20 flex place-items-center justify-center">
			<div class="flex flex-col gap-4 justify-center place-items-center">
				<h3 class="text-4xl font-bold">Convinced yet?</h3>
				<Button href="/docs" size="sm" class="w-fit">Yeah let's go!</Button>
			</div>
		</div>
	</div>
</main>
