<script lang="ts">
	import { PageWrapper } from '$lib/components/site/docs';

	let { data } = $props();

	const Markdown = $derived(data.component);
</script>

<PageWrapper {...data}>
	<Markdown />
</PageWrapper>
