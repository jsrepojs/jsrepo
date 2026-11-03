import { defineConfig } from 'jsrepo';
import { output } from '../../../src/output';

export default defineConfig({
	build: {
		transforms: [
			{
				transform: (content) => ({
					content: content.replace(/<!-- @fixture-header.*-->\n/, ''),
				}),
			},
		],
	},
	registry: {
		name: '@jsrepo/shadcn-svelte-fixture',
		homepage: 'https://example.com',
		excludeDeps: ['svelte'],
		outputs: [
			output({
				dir: '.output/jsrepo',
				aliases: {
					lib: '$lib',
					ui: '$lib/components/ui',
					components: '$lib/components',
					utils: '$lib/utils',
					hooks: '$lib/hooks',
				},
			}),
		],
		items: [
			{
				name: 'utils',
				type: 'lib',
				files: [{ path: 'src/lib/utils.ts' }],
			},
			{
				name: 'use-counter',
				type: 'hook',
				files: [{ path: 'src/lib/hooks/use-counter.svelte.ts' }],
			},
			{
				name: 'widget',
				title: 'Widget',
				description: 'A widget.',
				type: 'ui',
				files: [
					{
						path: 'src/lib/components/ui/widget',
						files: [
							{ path: 'index.ts' },
							{ path: 'widget.svelte' },
							{ path: 'widget-label.svelte' },
						],
					},
					{
						path: 'src/lib/components/ui/widget',
						role: 'test',
						files: [{ path: 'widget.test.ts' }],
					},
				],
			},
			{
				name: 'card',
				type: 'component',
				files: [
					{ path: 'src/lib/components/card.svelte' },
					{ path: 'src/lib/components/card.example.svelte', role: 'example' },
				],
			},
			{
				// transforms and targets aren't something the shadcn-svelte CLI knows about so it is not in registry.json
				name: 'banner',
				type: 'component',
				files: [
					{
						path: 'src/lib/components/banner.svelte',
						target: '$lib/components/fancy/banner.svelte',
					},
				],
			},
			{
				name: 'env-example',
				type: 'file',
				files: [{ path: '.env.example', target: '~/.env.example' }],
			},
			{
				name: 'demo-page',
				type: 'page',
				files: [{ path: 'src/routes/demo/+page.svelte', target: 'demo/+page.svelte' }],
			},
		],
	},
});
