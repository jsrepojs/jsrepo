import { unified } from 'unified';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeRaw from 'rehype-raw';
import { prettyCodeOptions } from '../../../mdsx.config';

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeRaw)
	.use(rehypeSlug)
	.use(rehypeExternalLinks, { target: '_blank' })
	.use(rehypeAutolinkHeadings)
	.use(rehypePrettyCode, prettyCodeOptions)
	.use(rehypeStringify);

export async function rehype(md: string) {
	return processor.process(md);
}
