<script lang="ts">
	import { Snippet } from '$lib/components/ui/snippet';
	import { Button } from '$lib/components/ui/button';
	import AnimatedGradientText from '$lib/components/animations/animated-gradient-text.svelte';
</script>

<svelte:head>
	<title>jsrepo ~ Home</title>
	<meta
		name="description"
		content="The best way to share your code across projects in the js ecosystem."
	/>
</svelte:head>

<main class="flex place-items-center justify-center w-full px-4 pb-10">
	<div class="max-w-xl w-full">
		<div
			class="flex flex-col gap-5 justify-center place-items-center w-full min-h-[calc(100vh-3.5rem)]"
		>
			<AnimatedGradientText href="/docs/cli/update#%E2%9C%A8%20Update%20with%20AI%20%E2%9C%A8">
				Introducing ✨ Update with AI ✨
			</AnimatedGradientText>
			<div class="flex place-items-center gap-4 justify-center w-full">
				<h1
					class="bg-primary text-primary-foreground select-none sm:text-6xl text-4xl font-serif font-bold py-4 px-4 w-fit"
				>
					jsrepo
				</h1>
				<span class="text-2xl sm:text-4xl font-serif text-muted-foreground">v1.0.0</span>
			</div>
			<p class="text-lg text-muted-foreground">
				The best way to reuse <span class="text-primary">your</span> code.
			</p>
			<Snippet command="execute" args={['jsrepo', 'init']} class="max-w-[450px]" />
			<div class="flex place-items-center gap-2">
				<Button href="/docs">Get Started</Button>
				<Button href="/docs/setup/registry" variant="outline">New Registry</Button>
			</div>
		</div>
		<div class="-mt-32">
			<iframe
				class="aspect-video w-full"
				src="https://www.youtube.com/embed/IyJQI3z8PWg?si=zhg54w9mE97s6K9c"
				title="YouTube video player"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				referrerpolicy="strict-origin-when-cross-origin"
				allowfullscreen
			></iframe>
		</div>
	</div>
</main>
