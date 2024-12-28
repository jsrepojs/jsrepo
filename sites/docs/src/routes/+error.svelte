<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
</script>

<main class="h-svh flex place-items-center justify-center px-6">
	<div class="flex flex-col gap-5 justify-center place-items-center">
		<div class="flex flex-col gap-2 justify-center place-items-center">
			{#if page.status === 404}
				<h1 class="text-6xl sm:text-8xl font-bold text-center">
					{page.status}
				</h1>
				<h2 class="text-2xl text-center">Page Not Found</h2>
				<p class="text-muted-foreground sm:text-lg text-center">
					Sorry we couldn't find what you were looking for!
				</p>
			{:else}
				<h1 class="text-6xl sm:text-8xl font-bold text-center">
					{page.status}
				</h1>
			{/if}
		</div>
		<Button href="/">Go back home</Button>
	</div>
</main>
