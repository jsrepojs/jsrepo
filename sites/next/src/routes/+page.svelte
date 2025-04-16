<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Marquee } from '$lib/components/animations/marquee';
	import * as Icons from '$lib/components/icons';
	import * as Terminal from '$lib/components/ui/terminal';
	import { Window } from '$lib/components/ui/window';
</script>

<svelte:head>
	<title>jsrepo - Home</title>
	<meta
		name="description"
		content="The best way to share your code across projects in the js ecosystem."
	/>
</svelte:head>

<main class="container flex w-full flex-col pb-10 pt-[--header-height]">
	<div class="grid gap-8 py-12 md:py-20 lg:grid-cols-2 lg:place-items-center lg:py-32">
		<div class="flex max-w-2xl flex-col place-items-start text-left">
			<h1 class="text-4xl font-semibold sm:text-6xl">Maintainable source registries</h1>
			<p class="text-lg text-muted-foreground">
				jsrepo provides a rich set of features to make distributing and consuming code from source
				registries maintainable.
			</p>

			<div class="flex place-items-center justify-center py-2 sm:py-5">
				<div class="flex place-items-center gap-2">
					<Button href="/docs">Get Started</Button>
					<Button href="/registries" variant="outline">See Registries</Button>
				</div>
			</div>
		</div>
		<div class="h-full w-full overflow-hidden lg:col-start-2">
			<Window class="h-[405px] pb-4 text-sm"
				><pre><span class="text-muted-foreground"
						>{'       + 18 more unchanged (-E to expand)'}</span
					>
{` 21      		switch (country) {
 22					case "US":
 23						return \`Hello, {name}!\`;`}
{' 24'}<span class="text-green-400">{` 				case "ES":`}</span>
{' 24'}<span class="text-green-400">{`						return \`Hola, {name}!\`;`}</span>
{` 26			    }
 27      }
 28
 `}<span class="text-muted-foreground">{'       + 58 more unchanged (-E to expand)'}</span>{`
 
   Accept changes?
   ○ Accept
   ○ Reject
   ● ✨ Update with AI ✨
 `}</pre>
			</Window>
		</div>
	</div>

	<div class="mt-20 flex w-full flex-col place-items-center justify-center">
		<div class="flex w-full flex-col place-items-center justify-center gap-6 lg:flex-row">
			<div class="text-center lg:max-w-sm lg:text-left">
				<h3 class="text-4xl font-bold">Move quickly</h3>
				<p class="text-muted-foreground">
					With unified build tooling theres no need to write your own scripts.
				</p>
			</div>
			<Terminal.Loop delay={750}>
				<Terminal.Root class="min-h-[250px] max-w-xl font-mono text-sm">
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

	<div class="mt-20 flex w-full flex-col place-items-center justify-center">
		<div class="flex w-full flex-col place-items-center justify-center gap-6 lg:flex-row">
			<Terminal.Loop delay={750}>
				<Terminal.Root class="order-2 min-h-[250px] max-w-xl font-mono text-sm lg:order-1">
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
						completeMessage="Installed clsx@^2.1.1 tailwind-merge@^2.6.0 @lucide/svelte@^0.475.0 bits-ui@^1.1.0 tailwind-variants@^0.3.1"
					/>
					<Terminal.AnimatedSpan delay={5250} class="text-green-500"
						>✔ All done.</Terminal.AnimatedSpan
					>
				</Terminal.Root>
			</Terminal.Loop>
			<div class="order-1 text-center lg:order-2 lg:max-w-sm lg:text-left">
				<h3 class="text-4xl font-bold">Add from anywhere</h3>
				<p class="text-muted-foreground">
					Github, GitLab, BitBucket, Azure, or even your own domain!
				</p>
			</div>
		</div>
	</div>

	<div class="mt-20 flex w-full flex-col place-items-center justify-center">
		<div class="flex w-full flex-col place-items-center justify-center gap-6 lg:flex-row">
			<div class="text-center lg:max-w-sm lg:text-left">
				<div>
					<h3 class="text-4xl font-bold">Update with confidence</h3>
					<p class="text-muted-foreground">View changes before they're part of your codebase.</p>
				</div>
			</div>
			<Terminal.Loop delay={750}>
				<Terminal.Root
					class="order-2 h-[400px] max-w-xl overflow-hidden font-mono text-sm lg:order-1"
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

	<div class="mt-20 flex w-full flex-col place-items-center justify-center">
		<div class="py-4 text-center">
			<h3 class="text-4xl font-bold">Use what YOU use</h3>
			<p class="text-muted-foreground">And let jsrepo do the rest.</p>
		</div>
		<div
			class="relative flex h-full w-full max-w-lg flex-col items-center justify-center overflow-hidden"
		>
			<Marquee class="w-full [--duration:16s]" repeat={10}>
				<Icons.TypeScript class="mx-2 size-11" />
				<Icons.Svelte class="mx-2 size-11" />
				<Icons.React class="mx-2 size-11" />
				<Icons.Vue class="mx-2 size-11" />
				<Icons.CSS class="mx-2 size-11" />
				<Icons.HTML class="mx-2 size-11" />
				<Icons.JavaScript class="mx-2 size-11" />
				<Icons.SASS class="mx-2 size-11" />
				<Icons.Yaml class="mx-2 size-11" />
				<Icons.Svg class="mx-2 size-11" />
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
		<div class="flex flex-col place-items-center justify-center gap-4">
			<h3 class="text-4xl font-bold">Convinced yet?</h3>
			<Button href="/docs" size="sm" class="w-fit">Yeah let's go!</Button>
		</div>
	</div>
</main>
