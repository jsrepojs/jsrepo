import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import * as UI from "@/components/ui";
import * as Logos from "@/components/logos";
import * as Icons from "lucide-react";

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
	return {
		...defaultMdxComponents,
		pre: ({ ref: _ref, ...props }) => (
			<CodeBlock {...props}>
				<Pre>{props.children}</Pre>
			</CodeBlock>
		),
		TypeTable,
		...Logos,
		...UI,
		...(Icons as unknown as MDXComponents),
		...components,
	};
}
