<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '@fontsource-variable/jetbrains-mono';
	import '@fontsource-variable/inter';
	import '../app.css';
	import Header from '$lib/components/site/header.svelte';
	import { commandContext, pmContext } from '$lib/ts/context';
	import Footer from '$lib/components/site/footer.svelte';
	import { ShikiProvider } from '$lib/components/ui/code';
	import Command from '$lib/components/site/command.svelte';
	import { shortcut } from '$lib/actions/shortcut.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/site/app-sidebar.svelte';
	import { page } from '$app/state';
	import { Portal } from 'bits-ui';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	pmContext.init('npm');

	const commandOpen = commandContext.init(false);

	let { children, data } = $props();

	const isMobile = new IsMobile();
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
	<Sidebar.Provider open={page.url.pathname.startsWith('/docs')}>
		<AppSidebar {...data} />

		{#if isMobile.current}
			<!-- Moves the trigger with context to the header -->
			<Portal to="#sidebar-trigger-portal-target">
				<Sidebar.Trigger />
			</Portal>
		{/if}

		<main class="min-h-svh w-full flex place-items-center justify-center flex-col">
			{@render children()}
			<Footer {...data} />
		</main>
	</Sidebar.Provider>
</ShikiProvider>
