import { defineConfig } from "jsrepo";

export default defineConfig({
	registries: ["http://localhost:3000/registry-kit/react"],
	paths: {
		component: 'src/components/ui',
		block: 'src/components',
		lib: 'src/lib',
		global: 'src/utils',
		utils: 'lib/utils'
	},
});
