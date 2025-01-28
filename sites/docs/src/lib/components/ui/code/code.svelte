<!--
	jsrepo 1.22.1
	Installed from github/ieedan/shadcn-svelte-extras
	12-23-2024
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import Copy from './copy.svelte';
	import { shikiContext } from '.';
	import { tv, type VariantProps } from 'tailwind-variants';
	import type { SupportedLanguage } from './langs';

	const style = tv({
		base: 'not-prose relative h-fit max-h-[650px] overflow-auto rounded-lg border',
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
		lang?: SupportedLanguage;
		code: string;
		class?: string;
		copyButtonContainerClass?: string;
		hideLines?: boolean;
		hideCopy?: boolean;
		highlight?: (number | [number, number])[];
	};

	const within = (num: number, range: Props['highlight']) => {
		if (!range) return false;

		let within = false;

		for (const r of range) {
			if (typeof r === 'number') {
				if (num === r) {
					within = true;
					break;
				}
				continue;
			}

			if (r[0] <= num && num <= r[1]) {
				within = true;
				break;
			}
		}

		return within;
	};

	let {
		variant = 'default',
		lang = 'diff',
		code,
		copyButtonContainerClass = undefined,
		class: className = undefined,
		hideLines = false,
		hideCopy = false,
		highlight = []
	}: Props = $props();

	const highlighter = shikiContext.get();

	const highlighted = $derived(
		$highlighter?.codeToHtml(code, {
			lang: lang,
			themes: {
				light: 'github-light-default',
				dark: 'github-dark-default'
			},
			transformers: [
				{
					pre: (el) => {
						el.properties.style = '';

						if (!hideLines) {
							el.properties.class += ' line-numbers';
						}

						return el;
					},
					line: (node, line) => {
						if (within(line, highlight)) {
							node.properties.class = node.properties.class + ' line--highlighted';
						}

						return node;
					}
				}
			]
		}) ?? code
	);
</script>

<div class={cn(style({ variant }), className)}>
	{@html highlighted}
	{#if !hideCopy}
		<div
			class={cn(
				'absolute right-2 top-2 flex place-items-center justify-center',
				copyButtonContainerClass
			)}
		>
			<Copy {code} />
		</div>
	{/if}
</div>

<style lang="postcss">
	/* Shiki see: https://shiki.matsu.io/guide/dual-themes#class-based-dark-mode */
	:global(html.dark .shiki, html.dark .shiki span) {
		color: var(--shiki-dark) !important;
		background-color: var(--bg-background) !important;
		font-style: var(--shiki-dark-font-style) !important;
		font-weight: var(--shiki-dark-font-weight) !important;
		text-decoration: var(--shiki-dark-text-decoration) !important;
	}

	:global(pre.shiki) {
		@apply border border-border;
	}
</style>
