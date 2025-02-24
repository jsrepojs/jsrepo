<script lang="ts">
	type Props = {
		version: Promise<string>;
	};

	let { version }: Props = $props();
</script>

{#await version}
	1.0.0
{:then ver}
	{ver}
{/await}
