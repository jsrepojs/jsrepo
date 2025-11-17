import * as Base from "fumadocs-ui/components/codeblock";
import { highlight } from "fumadocs-core/highlight";
import { type HTMLAttributes } from "react";
import { transformerNotationDiff, transformerNotationHighlight } from "@shikijs/transformers";

export async function CodeBlock({
	code,
	lang,
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

	return <Base.CodeBlock {...rest}>{rendered}</Base.CodeBlock>;
}
