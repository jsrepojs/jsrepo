<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/open-sans';
	import '@fontsource-variable/jetbrains-mono';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />
{@render children()}
