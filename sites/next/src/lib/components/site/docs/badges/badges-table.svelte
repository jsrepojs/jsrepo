<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Check, Copy } from '@lucide/svelte';
	import { scale } from 'svelte/transition';

	const badges = [
		{
			alt: 'jsrepo logo',
			href: 'https://jsrepo.dev/badges/jsrepo.svg'
		},
		{
			alt: 'jsrepo build passing',
			href: 'https://jsrepo.dev/badges/build/passing.svg'
		},
		{
			alt: 'jsrepo build failing',
			href: 'https://jsrepo.dev/badges/build/failing.svg'
		}
	];

	let copied = $state<number>();

	const copy = async (id: number, content: string) => {
		await navigator.clipboard.writeText(content);

		copied = id;

		setTimeout(() => {
			copied = undefined;
		}, 750);
	};
</script>

<Table.Root class="w-fit">
	<Table.Header>
		<Table.Row>
			<Table.Head>Badge</Table.Head>
			<Table.Head></Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each badges as { alt, href }, i (i)}
			<Table.Row>
				<Table.Cell>
					<div class="flex place-items-center gap-2">
						<!-- we slice off the domain so we just serve directly from static -->
						<img src={href.slice(18)} {alt} />
					</div>
				</Table.Cell>
				<Table.Cell>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="ghost" size="icon" class="size-8" {...props}>
									{#if copied == i}
										<div in:scale={{ start: 0.75, duration: 150 }}>
											<Check class="size-4" />
										</div>
									{:else}
										<div in:scale={{ start: 0.75, duration: 150 }}>
											<Copy class="size-4" />
										</div>
									{/if}
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Item onclick={() => copy(i, href)}>Url</DropdownMenu.Item>
							<DropdownMenu.Item
								onclick={() => {
									const content = `[![jsrepo](${href})](https://jsrepo.dev)`;
									copy(i, content);
								}}
							>
								Markdown
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
