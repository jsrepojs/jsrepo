import MarkdownIt from 'markdown-it';
import { markdownItTable } from 'markdown-it-table';
import { highlighter } from '$lib/components/ui/code/shiki';
import { fromHighlighter } from '@shikijs/markdown-it/core';

let md: MarkdownIt | null = null;

const markdownIt = async () => {
	if (md != null) return md;

	const newMd = MarkdownIt({ html: true });

	const stripComments = (md: MarkdownIt) => {
		md.core.ruler.before('normalize', 'strip_comments', function (state) {
			state.src = state.src.replace(/<!--[\s\S]*?-->/g, '');
		});
	};

	// plugins
	newMd.use(stripComments);
	newMd.use(markdownItTable);

	const hl = await highlighter;

	newMd.use(
		fromHighlighter(hl, {
			themes: {
				light: 'github-light-default',
				dark: 'github-dark-default'
			}
		})
	);

	md = newMd;

	return md;
};

export { markdownIt };
