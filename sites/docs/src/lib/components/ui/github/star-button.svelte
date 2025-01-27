<script lang="ts">
	import { Button, type ButtonProps } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Icons from '$lib/components/icons';
	import { Star } from 'lucide-svelte';

	interface Props extends ButtonProps {
		stars: number;
	}

	let { stars, ...rest }: Props = $props();
</script>

<Button target="_blank" href="https://github.com/ieedan/jsrepo" variant="ghost" {...rest}>
	<span class="sr-only">GitHub</span>
	<Icons.GitHub />
	<div class="hidden sm:flex place-items-center gap-1.5 h-full">
		<Separator orientation="vertical" />
		<span>
			<Star class="inline-flex size-3 text-primary -mt-0.5" />
			<span class="text-sm text-muted-foreground font-mono">{stars}</span>
		</span>
	</div>
</Button>
