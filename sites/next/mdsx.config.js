import { createHighlighter } from 'shiki';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';

/**
 * @type {import('rehype-pretty-code').Options}
 */
export const prettyCodeOptions = {
	theme: {
		dark: 'github-dark-default',
		light: 'github-light-default'
	},
	getHighlighter: (options) =>
		createHighlighter({
			...options,
			langs: [
				'plaintext',
				import('shiki/langs/javascript.mjs'),
				import('shiki/langs/typescript.mjs'),
				import('shiki/langs/svelte.mjs'),
				import('shiki/langs/sh.mjs'),
				import('shiki/langs/jsonc.mjs'),
				import('shiki/langs/json.mjs'),
				import('shiki/langs/yaml.mjs')
			]
		}),
	keepBackground: false,
	onVisitLine(node) {
		// Prevent lines from collapsing in `display: grid` mode, and allow empty
		// lines to be copy/pasted
		if (node.children.length === 0) {
			node.children = [{ type: 'text', value: ' ' }];
		}
	},
	onVisitHighlightedLine(node) {
		node.properties.className = ['line--highlighted'];
	},
	onVisitHighlightedChars(node) {
		node.properties.className = ['chars--highlighted'];
	}
};

/** @type {import('mdsx').MDSXConfig} */
const options = {
	remarkPlugins: [remarkGfm],
	rehypePlugins: [
		rehypeSlug,
		rehypeAutolinkHeadings,
		[rehypePrettyCode, prettyCodeOptions],
		[rehypeExternalLinks, { target: '_blank' }]
	],
	extensions: ['.svx', '.md'],
	blueprints: {
		default: {
			path: 'src/lib/components/site/docs/markdown/blueprint.svelte'
		}
	}
};

export default options;
