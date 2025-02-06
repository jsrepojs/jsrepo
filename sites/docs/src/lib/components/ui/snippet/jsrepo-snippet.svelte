<script lang="ts">
	import { cn } from '$lib/utils';
	import { CopyButton } from '$lib/components/ui/copy-button';

	type Props = {
		args: string[];
		class?: string;
	};

	let { args, class: className }: Props = $props();

	const text = $derived(`jsrepo ${args.join(' ')}`);
</script>

<div
	class={cn(
		'border border-border relative bg-card rounded-md px-4 py-3 w-full text-sm font-mono text-muted-foreground flex justify-between place-items-center',
		className
	)}
>
	<div class="text-nowrap max-w-full overflow-x-auto scrollbar-hide">
		<span class="text-foreground dark:text-primary">jsrepo</span>
		<span>{args.join(' ')}</span>
	</div>
	<CopyButton {text} class="size-6 absolute top-1/2 -translate-y-1/2 right-2" />
</div>
