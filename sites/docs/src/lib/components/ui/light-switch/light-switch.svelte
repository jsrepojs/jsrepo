<!--
	Installed from github/ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { Sun, Moon } from '@lucide/svelte';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';

	type Props = {
		variant?: 'outline' | 'ghost';
		class?: string;
	};

	let { variant = 'outline', class: className }: Props = $props();
</script>

<Button onclick={toggleMode} {variant} size="icon" class={className}>
	<Sun
		class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
	/>
	<Moon
		class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
	/>
	<span class="sr-only">Toggle theme</span>
</Button>
