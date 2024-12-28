<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Icons from '$lib/components/icons';
	import { categories } from '$lib/map';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { active } from '$lib/actions/active.svelte';
	import { ChevronRight } from 'lucide-svelte';

	type Props = {
		version: string;
	};

	let { version }: Props = $props();

	const isMobile = new IsMobile();
</script>

<Sidebar.Root>
	<Sidebar.Header class="flex h-16 justify-center pl-6">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					size="lg"
					class="hover:bg-background-secondary active:bg-background-secondary dark:hover:bg-background-secondary dark:active:bg-background-secondary"
				>
					{#snippet child({ props })}
						<a href="/" {...props}>
							<div class="-ml-2.5 flex place-items-center gap-2">
								<Icons.Jsrepo class="size-20 shrink-0" />
								<span class="text-lg text-muted-foreground">v{version}</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		{#each categories.filter((cat) => isMobile.current || cat.name !== 'General') as { name: group, routes }}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group}</Sidebar.GroupLabel>
				<Sidebar.Menu>
					{#each routes as item (item.name)}
						<Collapsible.Root open>
							{#snippet child({ props })}
								<Sidebar.MenuItem {...props}>
									<Sidebar.MenuButton class="data-[active=true]:bg-background">
										{#snippet tooltipContent()}
											{item.name}
										{/snippet}
										{#snippet child({ props })}
											<a
												href={item.href}
												{...props}
												use:active={{ activeForSubdirectories: item.activeForSubdirectories }}
											>
												{#if item.icon}
													<item.icon />
												{/if}
												{item.name}
											</a>
										{/snippet}
									</Sidebar.MenuButton>
									{#if item.routes}
										<Collapsible.Trigger>
											{#snippet child({ props })}
												<Sidebar.MenuAction {...props} class="data-[state=open]:rotate-90">
													<ChevronRight />
													<span class="sr-only">Toggle</span>
												</Sidebar.MenuAction>
											{/snippet}
										</Collapsible.Trigger>
										<Collapsible.Content>
											<Sidebar.MenuSub>
												{#each item.routes as subItem (subItem.name)}
													<Sidebar.MenuSubItem>
														<Sidebar.MenuSubButton href={subItem.href}>
															{#if subItem.icon}
																<subItem.icon />
															{/if}
															<span>{subItem.name}</span>
														</Sidebar.MenuSubButton>
													</Sidebar.MenuSubItem>
												{/each}
											</Sidebar.MenuSub>
										</Collapsible.Content>
									{/if}
								</Sidebar.MenuItem>
							{/snippet}
						</Collapsible.Root>
					{/each}
				</Sidebar.Menu>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>
</Sidebar.Root>
