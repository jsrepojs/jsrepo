<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Check, Copy, Ellipsis } from '@lucide/svelte';
	import { scale } from 'svelte/transition';
	import * as Popover from '$lib/components/ui/popover';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import { Debounced } from 'runed';

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
</script>

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
										class="flex h-10 place-items-center justify-center rounded-md border border-border"
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
