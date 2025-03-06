<script lang="ts">
	import { Modal } from '$lib/components/ui/modal';
	import * as Command from '$lib/components/ui/command';
	import { commandContext } from '$lib/ts/context';
	import { categories } from '../../map';
	import { goto } from '$app/navigation';

	const open = commandContext.get();
</script>

<Modal bind:open={$open} class="p-0" hideClose>
	<Command.Root>
		<Command.Input placeholder="Search the documentation..." />
		<Command.List class="min-h-[300px]">
			<Command.Empty>No results found.</Command.Empty>
			{#each categories as category (category.name)}
				<Command.Group heading={category.name}>
					{#each category.routes as route (route.name)}
						<Command.Item
							onclick={async () => {
								await goto(route.href);
								$open = false;
							}}
						>
							{route.name}
						</Command.Item>
						{#each route.routes ?? [] as { name, href, icon: Icon } (name)}
							<Command.Item
								onclick={async () => {
									await goto(href);
									$open = false;
								}}
							>
								<span class="text-sm text-muted-foreground">{route.name} ~</span>
								{#if Icon}
									<Icon />
								{/if}
								{name}
							</Command.Item>
						{/each}
					{/each}
				</Command.Group>
			{/each}
		</Command.List>
	</Command.Root>
</Modal>
