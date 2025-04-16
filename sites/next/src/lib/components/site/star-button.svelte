<script lang="ts">
	import { Button, type ButtonProps } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Icons from '$lib/components/icons';
	import { Star } from '@lucide/svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	interface Props extends ButtonProps {
		stars: Promise<number>;
	}

	let { stars, ...rest }: Props = $props();

	let starCount = new Tween(0, { easing: cubicOut, duration: 2000 });

	stars.then((s) => starCount.set(s));
</script>

<Button
	target="_blank"
	href="https://github.com/ieedan/jsrepo"
	variant="outline"
	class="h-9 px-2"
	{...rest}
>
	<span class="sr-only">GitHub</span>
	<Icons.GitHub />
	<div class="hidden h-full place-items-center gap-1.5 sm:flex">
		<Separator orientation="vertical" />
		<div class="flex w-12 place-items-center gap-1">
			<Star class="inline-flex size-3 text-yellow-300" />
			<span class="p-0 text-right font-mono text-sm text-muted-foreground">
				{starCount.current.toFixed(0)}
			</span>
		</div>
	</div>
</Button>
