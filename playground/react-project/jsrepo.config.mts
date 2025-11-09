import { defineConfig } from 'jsrepo';
import stripTypes from '@jsrepo/transform-javascript';

export default defineConfig({
    // configure where stuff comes from here
    registries: ['http://localhost:3000/registry-kit/react'],
    // configure were stuff goes here
    paths: {
		component: 'src/components/ui',
		block: 'src/components',
		lib: 'src/lib'
	},
	transforms: [stripTypes()]
});