<script lang="ts">
	import { Blockquote, DocHeader, SubHeading } from '$lib/components/site/docs';

	type Registry = {
		name: string;
		description: string;
		link: string;
	};

	const groups: Record<string, Registry[]> = {
		React: [
			{
				name: 'DavidHDev/react-bits',
				description:
					'An open source collection of high quality, animated, interactive & fully customizable React components for building stunning, memorable user interfaces.',
				link: 'https://github.com/DavidHDev/react-bits'
			}
		],
		Svelte: [
			{
				name: 'shyakadavis/geist',
				description: 'Svelte implementation of the Geist Design System by Vercel. (WIP)',
				link: 'https://github.com/shyakadavis/geist'
			},
			{
				name: 'ieedan/shadcn-svelte-extras',
				description: 'Turn key shadcn-svelte components to help finish you your app.',
				link: 'https://github.com/ieedan/shadcn-svelte-extras'
			}
		],
		TypeScript: [
			{
				name: 'ieedan/std',
				description: 'Fully tested and documented types and utility functions brokered by jsrepo.',
				link: 'https://github.com/ieedan/std'
			}
		]
	};
</script>

<DocHeader title="Registries" description="A few of the awesome registries built with jsrepo." />
<Blockquote variant="primary">If you want your registry featured here open a PR!</Blockquote>
{#each Object.entries(groups) as [group, registries]}
	<SubHeading>{group}</SubHeading>
	<ul class="flex flex-col gap-2">
		{#each registries as registry}
			<li>
				<a target="_blank" href={registry.link} class="group">
					<h3 class="font-medium group-hover:underline">{registry.name}</h3>
					<p class="text-muted-foreground">{registry.description}</p>
				</a>
			</li>
		{/each}
	</ul>
{/each}
