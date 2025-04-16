<script lang="ts">
	import * as Icons from '$lib/components/icons';
	import * as Card from '$lib/components/ui/card';
	import { Server } from '@lucide/svelte';

	const providers = [
		{
			name: 'GitHub',
			icon: Icons.GitHub,
			href: '/docs/registry/providers/github'
		},
		{
			name: 'GitLab',
			icon: Icons.GitLab,
			href: '/docs/registry/providers/gitlab'
		},
		{
			name: 'BitBucket',
			icon: Icons.BitBucket,
			href: '/docs/registry/providers/bitbucket'
		},
		{
			name: 'AzureDevops',
			icon: Icons.AzureDevops,
			href: '/docs/registry/providers/azure'
		},
		{
			name: 'Custom',
			icon: Server,
			href: '/docs/registry/providers/self-hosted'
		}
	];
</script>

<div class="mt-4 grid w-full grid-cols-2 gap-2">
	{#each providers as provider (provider.href)}
		<Card.Root>
			<Card.Content
				class="relative flex aspect-video flex-col place-items-center justify-center gap-2 transition-all hover:bg-accent/50"
			>
				<provider.icon class="size-12" />
				<a href={provider.href} class="!font-normal text-muted-foreground !no-underline">
					<span class="absolute inset-0"></span>
					{provider.name}
				</a>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
