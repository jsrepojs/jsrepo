import { output as shadcn } from '@jsrepo/shadcn/output';
import { defineConfig } from 'jsrepo';
import { distributed } from 'jsrepo/outputs';

export default defineConfig({
	registry: {
		name: '@example/react',
		version: 'package',
		homepage: 'https://www.jsrepo.com/@example/react',
		outputs: [
			distributed({ dir: './public/r', format: true }),
			shadcn({ dir: './public/r/shadcn', format: true }),
		],
		items: [
			{
				name: 'button',
				type: 'ui',
				files: [
					{
						path: 'src/registry/ui/button.tsx',
					},
					{
						path: 'src/app/demos/button-demo/page.tsx',
						type: 'page',
						role: 'example',
						target: 'src/app/demos/button-demo/page.tsx',
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
