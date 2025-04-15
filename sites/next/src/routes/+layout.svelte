<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import { UmamiAnalytics } from '@lukulent/svelte-umami';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '$lib/components/site/header.svelte';
	import { dev } from '$app/environment';

	let { data, children } = $props();
</script>

<!-- only inject analytics in production -->
{#if !dev}
	<UmamiAnalytics
		srcURL="https://cloud.umami.is/script.js"
		websiteID="ffe1e15d-153b-47ab-99c7-9defc1302c9f"
	/>
{/if}
<ModeWatcher />

<div style="--header-height: 64px; --aside-width: 14rem; --sidebar-width: 14rem;">
	{@render children()}

	<!-- fun markup ordering sh*t -->
	<Header stars={data.stars} />
</div>
