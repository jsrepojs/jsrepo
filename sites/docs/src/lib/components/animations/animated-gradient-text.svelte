<!-- https://animation-svelte.vercel.app/magic/animated-gradient-text -->

<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	interface Props extends HTMLAnchorAttributes {
		colorClass?: string;
		class?: string;
		children: Snippet<[]>;
	}

	let { class: className, colorClass, children, href, ...rest }: Props = $props();
</script>

<a
	{...rest}
	{href}
	class={cn(
		'group relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#8fdfff1f] backdrop-blur-sm transition-shadow duration-500 ease-out [--bg-size:300%] hover:shadow-[inset_0_-5px_10px_#8fdfff3f] bg-background',
		className
	)}
>
	<div
		class={cn(
			'absolute inset-0 block h-full w-full animate-gradient bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:var(--bg-size)_100%] p-[1px] ![mask-composite:subtract] [border-radius:inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]',
			colorClass
		)}
	></div>

	<span
		class="inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent"
	>
		{@render children()}
	</span>
</a>
