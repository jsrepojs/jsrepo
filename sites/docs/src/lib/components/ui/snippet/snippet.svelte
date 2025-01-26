<script lang="ts">
	import type { Command } from 'package-manager-detector';
	import { resolveCommand } from 'package-manager-detector/commands';
	import CopyButton from './pm-copy-button.svelte';
	import { cn } from '$lib/utils';
	import { pmContext } from '$lib/ts/context';

	type Props = {
		command: Command;
		args: string[];
		class?: string;
	};

	let { command, args, class: className }: Props = $props();

	const pm = pmContext.get();

	const cmd = $derived(resolveCommand($pm, command, args));

	const text = $derived(`${cmd?.command} ${cmd?.args.join(' ')}`);
</script>

<div
	class={cn(
		'border border-border relative bg-card rounded-md px-4 py-3 w-full text-sm font-serif text-muted-foreground flex justify-between place-items-center',
		className
	)}
>
	<div class="text-nowrap max-w-full overflow-x-auto scrollbar-hide">
		<span class="text-primary">{cmd?.command}</span>
		<span>{cmd?.args.join(' ')}</span>
	</div>
	<CopyButton bind:pm={$pm} {text} class="absolute top-1/2 -translate-y-1/2 right-2" />
</div>
