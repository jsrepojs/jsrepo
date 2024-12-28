<script lang="ts">
	import { page } from '$app/state';
	import { onThisPage } from '$lib/ts/on-this-page';
	import { cn } from '$lib/utils';
	import { onMount, type Snippet } from 'svelte';

	type Props = {
		children: Snippet<[]>;
		class?: string;
	};

	const pageMap = onThisPage.get();

	let { children, class: className }: Props = $props();

	let ref = $state<HTMLHeadingElement>();

	onMount(() => {
		if (ref) {
			pageMap.update((val) => {
				const newVal = val;

				if (val.curr !== undefined) {
					if (val.curr.path !== page.url.pathname) {
						newVal.curr = {
							headings: [{ children: [], el: ref!, rank: 2 }],
							path: page.url.pathname
						};
					} else {
						newVal.curr = {
							headings: [...val.curr.headings, { children: [], el: ref!, rank: 2 }],
							path: page.url.pathname
						};
					}
				} else {
					newVal.curr = {
						headings: [{ children: [], el: ref!, rank: 2 }],
						path: page.url.pathname
					};
				}

				newVal.headings.set(newVal.curr.path, newVal.curr.headings);

				return newVal;
			});
		}
	});
</script>

<h2
	id={ref?.innerText}
	bind:this={ref}
	class={cn('border-b border-border py-2 text-2xl font-bold scroll-m-16', className)}
>
	{@render children()}
</h2>
