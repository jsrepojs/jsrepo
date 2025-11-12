import { defineConfig } from '../../../dist/api/index';

export default defineConfig({
	registry: {
		name: '@jsrepo/test',
		authors: ['Aidan Bleser'],
		bugs: 'https://github.com/jsrepojs/jsrepo/issues',
		description: 'A test registry',
		homepage: 'https://github.com/jsrepojs/jsrepo',
		repository: 'https://github.com/jsrepojs/jsrepo',
		tags: ['test', 'registry'],
		version: '0.0.1',
		excludeDeps: ['react'],
		defaultPaths: {
			utils: './src/utils',
		},
		items: [
			{
				name: 'math',
				type: 'utils',
				files: [
					{
						path: 'src/utils/math/add.ts',
					},
                    {
                        path: 'src/utils/math/answer-format.ts',
                    },
                    {
						path: 'src/utils/math/add.test.ts',
                        type: 'registry:test',
					},
				],
			},
			{
				name: 'stdout',
				type: 'utils',
				files: [
					{
						path: 'src/utils/stdout.ts',
					},
				],
			},
            {
                name: 'shiki',
                type: 'utils',
                files: [
                    {
                        path: 'src/utils/shiki.ts',
                    },
                ],
            },
			{
				name: 'button',
                title: 'Button',
                description: 'An awesome button component',
				type: 'component',
				files: [
					{
						path: 'src/components/ui/button.tsx',
					},
				],
			},
			{
				name: 'counter',
				type: 'component',
				files: [
					{
						path: 'src/components/ui/counter.svelte',
					},
				],
			},
		],
	},
});
