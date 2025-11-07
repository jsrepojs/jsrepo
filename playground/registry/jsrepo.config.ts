import { defineConfig, fs } from 'jsrepo';
import { distributed, repository } from 'jsrepo/outputs';

export default defineConfig({
	providers: [fs()],
	registry: [
		{
			name: '@jsrepo/playground',
			outputs: [distributed({ dir: '/r', format: true }), repository({ format: true })],
			plugins: {
				transforms: [
					{
						package: '@jsrepo/transform-prettier',
						optional: true,
					},
				],
			},
			defaultPaths: {
				global: 'src/utils',
				lib: 'lib/',
				utils: 'lib/utils',
				component: 'components/ui',
			},
			items: [
				{
					name: 'button',
					type: 'component',
					files: [
						{
							path: 'src/components/button.tsx',
						},
					],
				},
				{
					name: 'utils',
					type: 'lib',
					add: 'on-init',
					files: [
						{
							path: 'src/lib/utils.ts',
						},
					],
				},
				{
					name: 'logger',
					type: 'utils',
					files: [
						{
							path: 'src/utils/logger.ts',
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
					add: 'when-needed',
				},
				{
					name: 'noop',
					type: 'global',
					add: 'on-init',
					files: [
						{
							path: 'src/utils/noop.ts',
						},
					],
				},
				{
					name: 'test',
					type: 'rule',
					add: 'optionally-on-init',
					dependencyResolution: 'manual',
					files: [
						{
							path: 'rules/test.mdc',
							target: '.cursor/rules/test.mdc',
						},
					],
				},
			],
		},
	],
});
