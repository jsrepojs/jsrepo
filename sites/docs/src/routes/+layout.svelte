<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '@fontsource-variable/jetbrains-mono';
	import '@fontsource/inter';
	import '../app.css';
	import { Header } from '$lib/components/site/header';
	import { commandContext, pmContext } from '$lib/ts/context';
	import { Footer } from '$lib/components/site/footer';
	import { ShikiProvider } from '$lib/components/ui/code';
	import { Command } from '$lib/components/site/command';
	import { shortcut } from '$lib/actions/shortcut.svelte';

	pmContext.init('npm');

	const commandOpen = commandContext.init(false);

	let { children, data } = $props();
</script>

<svelte:window
	use:shortcut={{
		callback: () => {
			$commandOpen = true;
		},
		key: 'k',
		ctrl: true
	}}
/>

<ModeWatcher />
<Command />
<ShikiProvider>
	<Header {...data} />
	{@render children()}
	<Footer {...data} />
</ShikiProvider>
