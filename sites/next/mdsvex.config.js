import { createHighlighter } from 'shiki';
import { escapeSvelte } from 'mdsvex';

const theme = 'github-dark';
const highlighter = await createHighlighter({
	themes: [theme],
	langs: ['typescript', 'sh', 'bash', 'ts', 'js']
});

/** @type {import('mdsvex').MdsvexOptions} */
const options = {
	highlight: {
		highlighter: async (code, lang = 'text') => {
			const html = escapeSvelte(highlighter.codeToHtml(code, { lang, theme }));

			return `{@html \`${html}\` }`;
		}
	},
	extensions: ['.svx', '.md']
};

export default options;
