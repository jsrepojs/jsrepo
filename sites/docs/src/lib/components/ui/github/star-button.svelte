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

<Button target="_blank" href="https://github.com/ieedan/jsrepo" variant="ghost" {...rest}>
	<span class="sr-only">GitHub</span>
	<Icons.GitHub />
	<div class="hidden sm:flex place-items-center gap-1.5 h-full">
		<Separator orientation="vertical" />
		<div class="flex place-items-center gap-1 w-12">
			<Star class="inline-flex size-3 text-primary -mt-0.5" />
			<span class="text-sm text-muted-foreground font-mono text-right p-0">
				{starCount.current.toFixed(0)}
			</span>
		</div>
	</div>
</Button>
