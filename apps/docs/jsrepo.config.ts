import { defineConfig } from "jsrepo";
import { distributed } from "jsrepo/outputs";

export default defineConfig({
	registry: {
		outputs: [distributed({ dir: "./public/registry-kit/react" })],
		name: "registry-kit/react",
		authors: ["Aidan Bleser"],
		bugs: "https://github.com/jsrepojs/jsrepo/issues",
		description: "Registry blocks for your registry",
		homepage: "https://v3.jsrepo.dev/registry-kit/react",
		repository: "https://github.com/jsrepojs/jsrepo/",
		tags: ["react", "components", "registry"],
		version: "0.0.1",
		excludeDeps: ["react"],
		defaultPaths: {
			component: "src/components/ui",
			block: "src/components",
			lib: "src/lib",
		},
		plugins: {
			transforms: [
				{
					package: "@jsrepo/transform-prettier",
					optional: true,
				},
			],
		},
		items: [
			{
				name: "demo",
				type: "block",
				add: "when-added",
				files: [
					{
						path: "src/components/registry-kit/demo.tsx",
					},
					{
						path: "src/components/registry-kit/demo-example.tsx",
						type: "registry:example",
					},
					{
						path: 'src/components/registry-kit/demo',
						files: [
							{
								path: 'demo.tsx',
							}
						]
					}
				],
				envVars: {
					DATABASE_URL: 'https://example.com/database',
					DATABASE_SECRET_TOKEN: ""
				}
			},
			{
				name: "tabs",
				type: "component",
				add: "when-needed",
				files: [
					{
						path: "src/components/ui/tabs.tsx",
					},
				],
			},
			{
				name: "utils",
				type: "lib",
				add: "on-init",
				files: [
					{
						path: "src/lib/utils.ts",
					},
				],
			},
		],
	},
});
