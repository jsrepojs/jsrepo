<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '$lib/components/site/header.svelte';

	let { data, children } = $props();
</script>

<ModeWatcher />
<div style="--header-height: 64px; --aside-width: 14rem; --sidebar-width: 14rem;">
	{@render children()}

	<!-- fun markup ordering sh*t -->
	<Header stars={data.stars} />
</div>
