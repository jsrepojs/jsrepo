import MarkdownIt from 'markdown-it';
import { markdownItTable } from 'markdown-it-table';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { createHighlighterCore } from 'shiki/core';
import { fromHighlighter } from '@shikijs/markdown-it/core';

let md: MarkdownIt | null = null;

const highlighter = createHighlighterCore({
	themes: [
		import('@shikijs/themes/github-light-default'),
		import('@shikijs/themes/github-dark-default')
	],
	langs: [
		import('@shikijs/langs/typescript'),
		import('@shikijs/langs/javascript'),
		import('@shikijs/langs/tsx'),
		import('@shikijs/langs/jsx'),
		import('@shikijs/langs/bash'),
		import('@shikijs/langs/svelte'),
		import('@shikijs/langs/vue'),
		import('@shikijs/langs/diff'),
		import('@shikijs/langs/angular-html'),
		import('@shikijs/langs/angular-ts'),
		import('@shikijs/langs/yaml'),
		import('@shikijs/langs/yml'),
		import('@shikijs/langs/json'),
		import('@shikijs/langs/jsonc'),
		import('@shikijs/langs/sass'),
		import('@shikijs/langs/scss'),
		import('@shikijs/langs/css'),
		import('@shikijs/langs/html')
	],
	engine: createJavaScriptRegexEngine()
});

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
		// @ts-expect-error yeah idk the example showed this and it works
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
