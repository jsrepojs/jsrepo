import { defineConfig } from 'jsrepo';

export default defineConfig({
	registry: {
		name: '@example/svelte',
		homepage: 'https://www.jsrepo.com/@example/svelte',
		items: [
			{
				name: 'button',
				type: 'ui',
				files: [
					{
						path: 'src/registry/ui/button',
					},
				],
			},
			{
				name: 'utils',
				type: 'lib',
				files: [
					{
						path: 'src/registry/lib/utils.ts',
					},
				],
			},
		],
	},
});
