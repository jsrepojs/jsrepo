<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLAnchorElement> {
		class?: string;
		href: string;
		target?: '_blank' | '_parent' | '_self' | '_top';
	}

	let { href, class: className, children, target = '_self', ...rest }: Props = $props();
</script>

<a
	{...rest}
	{href}
	{target}
	class={cn('text-foreground dark:text-primary hover:underline', className)}
>
	{@render children?.()}
</a>
