import { JsrepoWordmark } from "@/components/logos/jsrepo-com";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can customize layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<>
					<JsrepoWordmark className="h-6" aria-label="jsrepo"/>
				</>
			),
		},
		// see https://fumadocs.dev/docs/ui/navigation/links
		links: [],
		githubUrl: "https://github.com/jsrepojs/jsrepo",
	};
}
