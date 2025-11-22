<script lang="ts">
import { onMount } from 'svelte';
import { Logger } from '../js/logger';

onMount(() => {
	Logger.warn('Mounted');
});
</script>

<button onclick={() => Logger.warn('Warning')}>
    Warn
</button>