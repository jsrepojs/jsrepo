<script lang="ts">
	import { page } from '$app/state';
	import { categories, type Route } from '$lib/map';
	import * as Pagination from '$lib/components/ui/pagination';
	import { checkIsActive } from '$lib/actions/active.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { onThisPage } from '$lib/ts/on-this-page';
	import { onNavigate } from '$app/navigation';

	type CurrentDoc = {
		route: Route;
		next?: Route;
		previous?: Route;
		parent?: Route;
	};

	const getCurrentDoc = (
		url: URL,
		routes: Route[],
		parent: Route | undefined = undefined,
		parentNext: Route | undefined = undefined
	): CurrentDoc | undefined => {
		for (let i = 0; i < routes.length; i++) {
			const route = routes[i];

			if (
				checkIsActive(new URL(route.href, page.url.origin).toString(), {
					activeForSubdirectories: false,
					url
				})
			) {
				return {
					route,
					next: route.routes ? route.routes[0] : (routes[i + 1] ?? parentNext),
					previous: routes[i - 1],
					parent
				};
			}

			if (route.routes) {
				const doc = getCurrentDoc(url, route.routes, route, routes[i + 1]);

				if (doc !== undefined) return doc;
			}
		}
	};

	const currentDoc = $derived(
		getCurrentDoc(
			page.url,
			categories.filter((a) => a.name !== 'General').flatMap((cat) => cat.routes)
		)
	);

	const pageMap = onThisPage.init({ headings: new Map() });

	onNavigate(() => ($pageMap.curr = undefined));

	const pageHeadings = $derived($pageMap.headings.get(page.url.pathname));

	// svelte-ignore state_referenced_locally
	let activeHeading = $state<string | undefined>(
		pageHeadings ? pageHeadings[0]?.el.innerText : undefined
	);

	$effect(() => {
		if (pageHeadings) {
			const observer = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						activeHeading = (entry.target as HTMLHeadingElement).innerText;
					}
				}
			});

			pageHeadings.forEach((heading) => {
				observer.observe(heading.el);
			});
		}
	});

	let { children } = $props();
</script>

<div class="relative xl:grid-cols-[1fr_300px] py-8 xl:grid xl:gap-10 flex justify-center w-full">
	<div
		class="flex flex-col gap-5 w-full justify-between flex-grow max-w-3xl px-6 lg:px-12"
		style="min-height: calc(100svh - 56px)"
	>
		<div class="flex flex-col gap-5">
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link href="/docs">Docs</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					{#if currentDoc}
						{#if currentDoc.parent}
							<Breadcrumb.Item>
								<Breadcrumb.Link href={currentDoc.parent.href}>
									{currentDoc.parent.name}
								</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Separator />
						{/if}
						<Breadcrumb.Item>
							<Breadcrumb.Page>{currentDoc.route.name}</Breadcrumb.Page>
						</Breadcrumb.Item>
					{/if}
				</Breadcrumb.List>
			</Breadcrumb.Root>
			{@render children?.()}
		</div>
		{#if currentDoc}
			<div class="flex w-full justify-between place-items-center gap-4 pt-9">
				<div>
					{#if currentDoc.previous}
						<Pagination.Previous href={currentDoc.previous.href}>
							{currentDoc.previous.name}
						</Pagination.Previous>
					{:else if currentDoc.parent}
						<Pagination.Previous href={currentDoc.parent.href}>
							{currentDoc.parent.name}
						</Pagination.Previous>
					{/if}
				</div>
				<div>
					{#if currentDoc.next}
						<Pagination.Next href={currentDoc.next.href}>
							{currentDoc.next.name}
						</Pagination.Next>
					{/if}
				</div>
			</div>
		{/if}
	</div>
	<div class="xl:flex flex-col hidden py-8 -mt-10 gap-3 sticky top-14 h-[calc(100vh-3.5rem)]">
		{#if pageHeadings && pageHeadings.length > 0}
			<p class="font-semibold text-sm">On This Page</p>
			<div class="flex flex-col gap-1">
				{#each pageHeadings as heading}
					<a
						href="#{heading.el.innerText}"
						class="text-muted-foreground text-sm hover:text-foreground hover:dark:text-primary transition-all data-[active=true]:text-foreground data-[active=true]:dark:text-primary"
						data-active={activeHeading === heading.el.innerText}
					>
						{heading.el.innerText}
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
