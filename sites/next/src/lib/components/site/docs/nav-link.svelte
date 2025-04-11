<script lang="ts">
	import { active } from '$lib/actions/active.svelte';
	import { cn } from '$lib/utils';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	interface Props extends HTMLAnchorAttributes {
		href: string;
		title: string;
	}

	let { href, title, class: className, ...rest }: Props = $props();
</script>

<a
	{...rest}
	{href}
	use:active={{ activeForSubdirectories: false }}
	class={cn('p-0.5 transition-all hover:text-foreground data-[active=true]:text-foreground')}
>
	{title}
</a>