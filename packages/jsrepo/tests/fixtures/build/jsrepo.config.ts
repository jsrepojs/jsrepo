import { defineConfig } from "../../../dist/api/index";

export default defineConfig({
	registry: {
		name: "@jsrepo/test",
		authors: ["Aidan Bleser"],
		bugs: "https://github.com/jsrepojs/jsrepo/issues",
		description: "A test registry",
		homepage: "https://github.com/jsrepojs/jsrepo",
		repository: "https://github.com/jsrepojs/jsrepo",
		tags: ["test", "registry"],
		version: "0.0.1",
		excludeDeps: ["react"],
		defaultPaths: {
			utils: "./src/utils",
		},
		items: [
			{
				name: "math",
				type: "utils",
				files: [
					{
						path: "src/utils/math",
						files: [
							{
								path: "add.ts",
							},
							{
								path: "answer-format.ts",
							},
						]
					},
					{
						path: 'src/utils/math',
						role: 'test',
						files: [
							{
								path: 'add.test.ts',
							},
							{
								path: 'answer-format.test.ts',
							}
						]
					}
				],
				categories: ['math', 'utils'],
				meta: {
					extendedDescription: 'Use this for basic math operations'
				}
			},
			{
				name: "stdout",
				type: "utils",
				files: [
					{
						path: "src/utils/stdout.ts",
					},
				],
			},
			{
				name: "utils",
				type: "lib",
				files: [
					{
						path: "src/utils.ts",
					},
				],
			},
			{
				name: "shiki",
				type: "utils",
				files: [
					{
						path: "src/utils/shiki.ts",
					},
				],
			},
			{
				name: "button",
				title: "Button",
				description: "An awesome button component",
				type: "ui",
				files: [
					{
						path: "src/components/ui/button.tsx",
					},
					{
						path: 'src/routes/demos/button-demo/page.tsx',
						type: 'page',
						role: 'example',
					}
				],
			},
			{
				name: "empty",
				type: "ui",
				files: [
					{
						path: "src/components/ui/empty",
					},
				],
			},
			{
				name: "counter",
				type: "ui",
				files: [
					{
						path: "src/components/ui/counter.svelte",
					},
				],
			},
			{
				name: 'demo-page',
				type: 'page',
				files: [
					{
						path: 'src/routes/demo',
						target: 'src/routes/demo'
					}
				]
			}
		],
	},
});
