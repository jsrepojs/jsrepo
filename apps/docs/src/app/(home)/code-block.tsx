import * as Base from "fumadocs-ui/components/codeblock";
import { highlight } from "fumadocs-core/highlight";
import { type HTMLAttributes } from "react";
import { transformerNotationDiff, transformerNotationHighlight } from "@shikijs/transformers";
import { cn } from "@/lib/utils";

export async function CodeBlock({
	code,
	lang,
	className,
	...rest
}: HTMLAttributes<HTMLElement> & {
	code: string;
	lang: string;
}) {
	const rendered = await highlight(code, {
		lang,
		components: {
			pre: (props) => <Base.Pre {...props} />,
		},
		transformers: [transformerNotationDiff(), transformerNotationHighlight()],
	});

	return (
		<Base.CodeBlock className={cn("h-full my-0 [&_div.overflow-auto]:h-full", className)} {...rest}>
			{rendered}
		</Base.CodeBlock>
	);
}
