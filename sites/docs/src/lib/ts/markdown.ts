import MarkdownIt from 'markdown-it';
import { markdownItTable } from 'markdown-it-table';

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

	md = newMd;

	return md;
};

export { markdownIt };
