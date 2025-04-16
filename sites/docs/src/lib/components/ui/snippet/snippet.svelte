<!--
	Installed from github/ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { tv, type VariantProps } from 'tailwind-variants';
	import { CopyButton } from '$lib/components/ui/copy-button';

	const style = tv({
		base: 'relative w-full max-w-full rounded-md border bg-background py-2.5 pl-3 pr-12',
		variants: {
			variant: {
				default: 'border-border',
				secondary: 'border-border bg-accent',
				destructive: 'border-destructive bg-destructive',
				primary: 'border-primary bg-primary text-primary-foreground'
			}
		}
	});

	type Variant = VariantProps<typeof style>['variant'];

	type Props = {
		variant?: Variant;
		text: string | string[];
		class?: string;
		onCopy?: () => void;
	};

	let { text, variant = 'default', onCopy, class: className }: Props = $props();
</script>

<div class={cn(style({ variant, className: className }))} data-snippet>
	{#if typeof text == 'string'}
		<pre class={cn('overflow-y-auto whitespace-nowrap text-left font-mono text-sm')}>
			{text}
		</pre>
	{:else}
		{#each text as line, i (i)}
			<pre class={cn('overflow-y-auto whitespace-nowrap text-left font-mono text-sm')}>
			{line}
		</pre>
		{/each}
	{/if}

	<CopyButton
		class="absolute right-2 top-1/2 size-7 -translate-y-1/2 transition-opacity ease-in-out hover:bg-transparent hover:text-opacity-80"
		text={typeof text === 'string' ? text : text.join('\n')}
		{onCopy}
	/>
</div>
