<!--
	Installed from github/ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { tv, type VariantProps } from 'tailwind-variants';
	import type { Command, Agent } from 'package-manager-detector';
	import { resolveCommand } from 'package-manager-detector/commands';
	import CopyButton from '$lib/components/ui/copy-button/copy-button.svelte';
	import { Clipboard } from '@lucide/svelte';

	const style = tv({
		base: 'w-full rounded-lg border border-border',
		variants: {
			variant: {
				default: 'bg-background',
				secondary: 'border-transparent bg-secondary/50'
			}
		}
	});

	type Variant = VariantProps<typeof style>['variant'];

	type Props = {
		variant?: Variant;
		class?: string;
		agents?: Agent[];
		agent?: Agent;
		command: Command;
		args: string[];
	};

	let {
		variant,
		class: className,
		command,
		agents = ['npm', 'pnpm', 'yarn', 'bun'],
		args,
		agent = $bindable('npm')
	}: Props = $props();

	const cmd = $derived(resolveCommand(agent, command, args));

	const commandText = $derived(`${cmd?.command} ${cmd?.args.join(' ')}`);
</script>

<div class={cn(style({ variant }), className)} data-pm-command>
	<div class="flex place-items-end justify-between border-b border-border px-2 pb-0 pt-1">
		<div class="flex place-items-center gap-1">
			{#each agents as pm (pm)}
				<button
					type="button"
					class={{
						'-mb-0.5 border-b-2 border-transparent p-1 font-mono text-sm': true,
						'border-b-primary': agent === pm
					}}
					onclick={() => (agent = pm)}
				>
					{pm}
				</button>
			{/each}
		</div>
		<CopyButton text={commandText} class="mb-1 size-6 [&_svg]:size-3">
			{#snippet icon()}
				<Clipboard />
			{/snippet}
		</CopyButton>
	</div>
	<div class="no-scrollbar overflow-x-auto p-3">
		<span class="text-nowrap font-mono text-sm">
			{commandText}
		</span>
	</div>
</div>

<style lang="postcss">
	:global(.no-scrollbar) {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
