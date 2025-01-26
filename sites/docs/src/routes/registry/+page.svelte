<script lang="ts">
	let { data } = $props();
</script>

<div class="h-svh flex flex-col place-items-center max-w-3xl">
	<div class="">
		<h1>Blocks</h1>
		<ul class="flex flex-col">
			{#each data.manifest as category}
				{#each category.blocks as block}
					<span>{block.category}/{block.name}</span>
				{/each}
			{/each}
		</ul>
	</div>
</div>
