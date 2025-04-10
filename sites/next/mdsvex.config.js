import { createHighlighter } from 'shiki';
import { escapeSvelte } from 'mdsvex';
import autolinkHeadings from 'rehype-autolink-headings';
import autoSlug from 'rehype-slug';

const theme = 'github-dark';
const highlighter = await createHighlighter({
	themes: [theme],
	langs: ['typescript', 'sh', 'bash', 'ts', 'js', 'jsonc', 'json']
});

/** @type {import('mdsvex').MdsvexOptions} */
const options = {
	highlight: {
		highlighter: async (code, lang = 'text') => {
			const html = escapeSvelte(highlighter.codeToHtml(code, { lang, theme }));

			return `{@html \`${html}\` }`;
		}
	},
	rehypePlugins: [autoSlug, autolinkHeadings],
	extensions: ['.svx', '.md']
};

export default options;
