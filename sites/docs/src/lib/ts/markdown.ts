import MarkdownIt from 'markdown-it';
import Shiki from '@shikijs/markdown-it';
import { markdownItTable } from 'markdown-it-table';

const markdownIt = async () => {
	const md = MarkdownIt();

	const stripComments = (md: MarkdownIt) => {
		md.core.ruler.before('normalize', 'strip_comments', function (state) {
			state.src = state.src.replace(/<!--[\s\S]*?-->/g, '');
		});
	};

	// plugins
	md.use(stripComments);
	md.use(markdownItTable);
	md.use(
		await Shiki({
			themes: {
				light: 'github-light-default',
				dark: 'github-dark-default'
			}
		})
	);

	return md;
};

export { markdownIt };
