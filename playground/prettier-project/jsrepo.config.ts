import prettier from '@jsrepo/transform-prettier';
import { defineConfig, fs } from 'jsrepo';

export default defineConfig({
	registries: ['fs://../registry'],
	providers: [fs()],
	transforms: [prettier()],
	paths: {
		'*': './src/items',
		utils: '@/lib/utils',
		lib: '@/lib',
		component: '@/components',
	},
});
