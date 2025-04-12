<script lang="ts">
	type Video = {
		title: string;
		description: string;
		src: string;
	};

	const videos: Video[] = [
		{
			title: 'Creating your first registry with jsrepo',
			description: 'How to create your first registry with jsrepo.',
			src: 'https://www.youtube.com/embed/IyJQI3z8PWg?si=zhg54w9mE97s6K9c'
		},
		{
			title: 'The features I am most excited about in jsrepo',
			description: 'Some new and existing features that make jsrepo awesome.',
			src: 'https://www.youtube.com/embed/6YocZSwjUW8?si=3ibzsmqTu6-IcOWS'
		},
		{
			title: 'Creating your own shadcn-style library with jsrepo',
			description: 'How to create a shadcn-style ui library with jsrepo.',
			src: 'https://www.youtube.com/embed/zWfBt1vKb84?si=_pbJ75Ww-tOX_Lui'
		},
		{
			title: 'Building the shadcn/ui registry with jsrepo',
			description:
				'How to build shadcn/ui into a jsrepo registry using some of the newest jsrepo features.',
			src: 'https://www.youtube.com/embed/tj7BUE9V7fw?si=igyhrWX4_yeajIUJ'
		}
	];
</script>

<svelte:head>
	<title>jsrepo ~ Demos</title>
	<meta name="description" content="jsrepo demos showing off the capabilities of the CLI." />
</svelte:head>

<main class="flex justify-center px-4 pt-[--header-height]" style="min-height: calc(100svh - 56px);">
	<div class="grid md:grid-cols-2 py-8 gap-5 flex-col h-fit">
		{#each videos as { title, description, src } (title)}
			<div class="border border-border rounded-lg max-w-[500px] overflow-hidden">
				<iframe
					class="aspect-video w-full"
					{src}
					title="YouTube video player"
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					referrerpolicy="strict-origin-when-cross-origin"
					allowfullscreen
				></iframe>
				<div class="p-4 border-t border-border">
					<h4>{title}</h4>
					<span class="text-muted-foreground">
						{description}
					</span>
				</div>
			</div>
		{/each}
	</div>
</main>
