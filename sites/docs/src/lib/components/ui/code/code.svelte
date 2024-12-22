<!--
	jsrepo 1.22.1
	Installed from github/ieedan/shadcn-svelte-extras
	12-22-2024
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import Copy from './copy.svelte';
	import { type BundledLanguage } from 'shiki';
	import { shikiContext } from '.';
	import { tv, type VariantProps } from 'tailwind-variants';

	const style = tv({
		base: 'not-prose relative rounded-lg border bg-accent py-4',
		variants: {
			variant: {
				default: 'border-border bg-transparent',
				secondary: 'border-transparent bg-secondary/50'
			}
		}
	});

	type Variant = VariantProps<typeof style>['variant'];

	type Props = {
		variant?: Variant;
		lang?: BundledLanguage;
		code: string;
		class?: string;
		copyButtonContainerClass?: string;
		hideLines?: boolean;
		hideCopy?: boolean;
	};

	let {
		variant = 'default',
		lang = 'typescript',
		code,
		copyButtonContainerClass = undefined,
		class: className = undefined,
		hideLines = false,
		hideCopy = false
	}: Props = $props();

	const highlighter = shikiContext.get();

	const highlighted = $derived(
		$highlighter?.codeToHtml(code, {
			lang: lang,
			themes: {
				light: 'github-light-default',
				dark: 'github-dark-default'
			}
		}) ?? code
	);
</script>

<div class={cn(style({ variant }), className)}>
	<div
		class="scrollbar-hide flex max-h-full max-w-full place-items-start overflow-x-auto overflow-y-auto selection:bg-blue-500/25"
	>
		<pre
			class="w-full flex-grow pl-6 text-sm"
			class:line-numbers={!hideLines}>{@html highlighted}</pre>
	</div>
	{#if !hideCopy}
		<div
			class={cn(
				'absolute right-1.5 top-1.5 flex place-items-center justify-center',
				copyButtonContainerClass
			)}
		>
			<Copy {code} />
		</div>
	{/if}
</div>

<style lang="postcss">
	:global(pre.line-numbers) {
		counter-reset: step;
		counter-increment: step 0;
	}

	:global(pre.line-numbers .line::before) {
		content: counter(step);
		counter-increment: step;
		width: 1rem;
		margin-right: 1.5rem;
		display: inline-block;
		text-align: right;
	}

	:global(pre.line-numbers .line::before) {
		@apply text-muted-foreground;
	}
</style>
