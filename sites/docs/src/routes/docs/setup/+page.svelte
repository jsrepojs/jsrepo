<script lang="ts">
	import { DocHeader, SubHeading } from '$lib/components/site/docs';

	const guides = [
		{
			name: 'New Project',
			description: 'Use blocks from a registry in your project.',
			href: '/docs/setup/project'
		},
		{
			name: 'New Registry',
			description: 'Host your own registry',
			href: '/docs/setup/registry'
		}
	];
</script>

<DocHeader title="Setup" description="Get started with jsrepo." />
<SubHeading>Guides</SubHeading>
<div class="grid md:grid-cols-2 grid-rows-2 md:grid-rows-1 gap-2">
	{#each guides as { name, href, description } (name)}
		<a
			{href}
			class="bg-background border border-border rounded-lg p-4 flex place-items-center justify-center h-44 hover:bg-secondary transition-all"
		>
			<div class="flex flex-col place-items-center justify-center">
				<h3 class="text-xl font-bold text-center">{name}</h3>
				<p class="text-muted-foreground text-center">{description}</p>
			</div>
		</a>
	{/each}
</div>
<div class="py-10">
	<iframe
		class="aspect-video w-full"
		src="https://www.youtube.com/embed/IyJQI3z8PWg?si=zhg54w9mE97s6K9c"
		title="YouTube video player"
		frameborder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
		referrerpolicy="strict-origin-when-cross-origin"
		allowfullscreen
	></iframe>
</div>
