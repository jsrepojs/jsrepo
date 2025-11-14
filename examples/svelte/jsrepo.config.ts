import { defineConfig } from 'jsrepo';
import { distributed } from 'jsrepo/outputs';

export default defineConfig({
	registry: {
		name: '@example/svelte',
		homepage: 'https://www.jsrepo.com/@example/svelte',
		outputs: [distributed({ dir: './static/r', format: true })],
		items: [
			{
				name: 'button',
				type: 'ui',
				files: [
					{
						path: 'src/lib/registry/ui/button',
					},
				],
			},
			{
				name: 'utils',
				type: 'lib',
				files: [
					{
						path: 'src/lib/registry/lib/utils.ts',
					},
				],
			},
		],
	},
});
