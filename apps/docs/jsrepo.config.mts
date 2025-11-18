import { defineConfig } from "jsrepo";

export default defineConfig({
	registries: ["https://reactbits.dev/r", "https://magicui.design/r", "https://ui.shadcn.com/r/styles/new-york-v4"],
	paths: {
		component: "@/components",
		util: "@/lib/utils",
		ui: "@/components/ui",
		lib: "@/lib",
		hook: "@/hooks",
	},
});
