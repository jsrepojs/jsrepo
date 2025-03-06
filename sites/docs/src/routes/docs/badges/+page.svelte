<script lang="ts">
	import { DocHeader, SubHeading } from '$lib/components/site/docs';
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Check, Copy, Ellipsis } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import * as Popover from '$lib/components/ui/popover';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import { Debounced } from 'runed';

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

	const dynamicBadges = [
		{
			alt: 'jsrepo blocks',
			href: 'https://jsrepo.dev/badges/registry/blocks?url='
		},
		{
			alt: 'jsrepo categories',
			href: 'https://jsrepo.dev/badges/registry/categories?url='
		},
		{
			alt: 'jsrepo dependencies',
			href: 'https://jsrepo.dev/badges/registry/dependencies?url='
		}
	];

	let registry = $state<string>('');

	const debounced = new Debounced(() => registry, 250);

	let copied = $state<number>();

	const copy = async (id: number, content: string) => {
		await navigator.clipboard.writeText(content);

		copied = id;

		setTimeout(() => {
			copied = undefined;
		}, 750);
	};
</script>

<DocHeader title="Badges" description="jsrepo badges you can add to your README." />
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
<SubHeading>Dynamic Badges</SubHeading>
<p>These badges will update based on your registry.</p>
<Table.Root class="w-fit">
	<Table.Header>
		<Table.Row>
			<Table.Head>Badge</Table.Head>
			<Table.Head></Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each dynamicBadges as { alt, href }, i (i)}
			<Table.Row>
				<Table.Cell>
					<div class="flex place-items-center gap-2">
						<!-- we slice off the domain so we just serve directly from static -->
						<img src={href.slice(18) + 'github/ieedan/std'} {alt} />
					</div>
				</Table.Cell>
				<Table.Cell>
					<Popover.Root>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button variant="ghost" size="icon" class="size-8" {...props}>
									<Ellipsis />
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content align="end">
							<div class="flex flex-col gap-2">
								<div>
									<Label>Registry Url</Label>
									<Input bind:value={registry} placeholder="i.e. github/ieedan/std" />
								</div>
								<div>
									<Label>Preview</Label>
									<div
										class="rounded-md border-border border h-10 flex place-items-center justify-center"
									>
										{#if registry !== ''}
											{#key debounced.current}
												<img src={href.slice(18) + registry} {alt} />
											{/key}
										{/if}
									</div>
								</div>
								<CopyButton
									variant="outline"
									size="default"
									disabled={registry === ''}
									text={href + registry}
								>
									{#snippet child({ status })}
										{#if status === 'success'}
											<div in:scale={{ duration: 300, start: 0.85 }}>
												<Check />
												<span class="sr-only">Copied</span>
											</div>
										{:else}
											<div
												class="flex place-items-center gap-2"
												in:scale={{ duration: 300, start: 0.85 }}
											>
												<Copy />
												Copy Url
												<span class="sr-only">Copy</span>
											</div>
										{/if}
									{/snippet}
								</CopyButton>
								<CopyButton
									variant="outline"
									size="default"
									disabled={registry === ''}
									text={`[![jsrepo](${href + registry})](https://jsrepo.dev/registry?url=${registry})`}
								>
									{#snippet child({ status })}
										{#if status === 'success'}
											<div in:scale={{ duration: 300, start: 0.85 }}>
												<Check />
												<span class="sr-only">Copied</span>
											</div>
										{:else}
											<div
												class="flex place-items-center gap-2"
												in:scale={{ duration: 300, start: 0.85 }}
											>
												<Copy />
												Copy Markdown
												<span class="sr-only">Copy</span>
											</div>
										{/if}
									{/snippet}
								</CopyButton>
							</div>
						</Popover.Content>
					</Popover.Root>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
