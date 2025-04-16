import removeMd from 'remove-markdown';
import fs from 'node:fs';
import path from 'node:path';

/** Remove markdown syntax
 *
 * @param {string} md
 * @returns
 */
function removeMarkdown(md) {
	return removeMd(md, { gfm: true, replaceLinksWithURL: true, useImgAltText: true });
}

/**
 * @param {any} docs
 */
export function generateIndex(docs) {
	console.log('[scripts/generate-index.ts] Generating `/docs` index...');

	const docsIndex = generateDocsIndex(docs);

	console.log('[scripts/generate-index.ts] Generated `/docs` index');

	const index = {
		docs: docsIndex
	};

	const targetPath = path.resolve(import.meta.dirname, '../static/search.json');

	fs.writeFileSync(targetPath, JSON.stringify(index));
}

/**
 * @param {any} docs
 */
function generateDocsIndex(docs) {
	const docsIndex = [];
	const basePath = path.resolve(import.meta.dirname, '../src/lib/docs');

	for (let i = 0; i < docs.docs.length; i++) {
		const doc = docs.docs[i];

		let docPath = path.join(basePath, `${doc.path}.md`);
		const isIndex = !fs.existsSync(docPath) || doc.path === 'index';

		if (!fs.existsSync(docPath)) {
			docPath = path.join(basePath, doc.path, 'index.md');
		}

		const content = removeMarkdown(fs.readFileSync(docPath).toString());

		const docsBasePath = '/docs';

		let href;

		if (isIndex && doc.path === 'index') {
			href = `${docsBasePath}/`;
		} else {
			href = `${docsBasePath}/${doc.path}`;
		}

		docsIndex.push({
			id: i,
			title: doc.title,
			href: href,
			content: `${doc.title}\n${doc.description}\n${content}`
		});
	}

	return docsIndex;
}
