<script lang="ts">
import { onMount } from 'svelte';
import { Logger } from '../js/logger';
import { usePrint } from './print.svelte';

usePrint('Hello, world!');

onMount(() => {
	Logger.warn('Mounted');
});
</script>

<button onclick={() => Logger.warn('Warning')}>
    Warn
</button>