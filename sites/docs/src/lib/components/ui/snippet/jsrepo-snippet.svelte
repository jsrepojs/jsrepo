<script lang="ts">
	import { cn } from '$lib/utils';
	import SimpleCopyButton from './copy-button.svelte';

	type Props = {
		args: string[];
		class?: string;
	};

	let { args, class: className }: Props = $props();

	const text = $derived(`jsrepo ${args.join(' ')}`);
</script>

<div
	class={cn(
		'border border-border relative bg-card rounded-md px-4 py-3 w-full text-sm font-serif text-muted-foreground flex justify-between place-items-center',
		className
	)}
>
	<div class="text-nowrap max-w-full overflow-x-auto scrollbar-hide">
		<span class="text-primary">jsrepo</span>
		<span>{args.join(' ')}</span>
	</div>
	<SimpleCopyButton {text} class="absolute top-1/2 -translate-y-1/2 right-2" />
</div>
