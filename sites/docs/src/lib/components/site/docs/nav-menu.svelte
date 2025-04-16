<script lang="ts">
	import { page } from '$app/state';
	import { map } from '$lib/docs/map';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import * as Icons from '$lib/components/icons';
	import { Dialog } from 'bits-ui';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import * as Nav from '$lib/components/site/nav';

	type Props = {
		open?: boolean;
	};

	let { open = $bindable(false) }: Props = $props();

	const isMobile = new IsMobile();

	$effect(() => {
		// close the dialog if we ever come out of mobile mode
		if (!isMobile.current) {
			open = false;
		}
	});

	function closeMenu() {
		open = false;
	}
</script>

<Dialog.Content
	class={cn(
		'fixed left-0 top-[--header-height] z-50 h-[calc(100svh-var(--header-height))] w-full bg-background'
	)}
>
	<div class="h-[calc(100svh-var(--header-height)-69px)] overflow-y-auto px-8 pb-4">
		<div class="flex flex-col gap-4">
			<Nav.Group title="General">
				<Nav.List>
					<Nav.Link href="/" title="Home" onclick={closeMenu} />
					<Nav.Link href="/docs" title="Docs" onclick={closeMenu} />
					<Nav.Link href="/registries" title="Registries" onclick={closeMenu} />
					<Nav.Link href="/demos" title="Demos" onclick={closeMenu} />
				</Nav.List>
			</Nav.Group>
			{#if page.url.pathname.startsWith('/docs')}
				{#each Object.entries(map) as [title, docs] (title)}
					<Nav.Group {title}>
						<Nav.List>
							{#each docs as doc (doc.title)}
								<Nav.Link title={doc.title} href={doc.href} tag={doc.tag} onclick={closeMenu} />
								{#if doc.children}
									<Nav.List class="ml-1 flex flex-col border-l pl-4">
										{#each doc.children as child (child.title)}
											<Nav.Link
												title={child.title}
												href={child.href}
												tag={child.tag}
												onclick={closeMenu}
											/>
										{/each}
									</Nav.List>
								{/if}
							{/each}
						</Nav.List>
					</Nav.Group>
				{/each}
			{/if}
		</div>
	</div>
	<div class="mx-8 flex place-items-center gap-2 border-t py-4">
		<LightSwitch class="size-9" />
		<Button
			target="_blank"
			href="https://github.com/ieedan/jsrepo"
			variant="outline"
			class="size-9 px-2"
		>
			<span class="sr-only">GitHub</span>
			<Icons.GitHub />
		</Button>
	</div>
</Dialog.Content>
