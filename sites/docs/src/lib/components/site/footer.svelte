<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Icons from '$lib/components/icons';
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import Version from './version.svelte';

	type Props = {
		version: Promise<string>;
	};

	let { version }: Props = $props();
</script>

<footer class="border-border border-t flex place-items-center justify-center px-6 w-full">
	<div class="w-full max-w-screen-2xl flex justify-between place-items-center h-full">
		<div class="flex justify-center py-8">
			<div class="flex place-items-center gap-2">
				<Icons.Jsrepo class="h-8" />
				<span class="text-sm text-muted-foreground">v<Version {version} /></span>
			</div>
		</div>
		<div class="flex place-items-center gap-1">
			<Button target="_blank" href="https://github.com/ieedan/jsrepo" variant="ghost" size="icon">
				<span class="sr-only">GitHub</span>
				<Icons.GitHub />
			</Button>
			<LightSwitch />
		</div>
	</div>
</footer>
