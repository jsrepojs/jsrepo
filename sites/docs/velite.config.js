import { defineConfig, s } from 'velite';
import { generateIndex } from '$lib/scripts/generate-index.js';

export default defineConfig({
	root: './src/lib/docs',
	collections: {
		docs: {
			name: 'Docs',
			pattern: './**/*.md',
			schema: s.object({
				title: s.string().max(25),
				description: s.string(),
				lastUpdated: s.isodate(),
				path: s.path()
			})
		}
	},
	complete: generateIndex
});
