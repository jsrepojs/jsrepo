import fs from 'node:fs';
import * as parse5 from 'parse5';
import * as prettier from 'prettier';
import { type Lang, formatError, resolveImports } from '.';
import * as lines from '../blocks/ts/lines';
import { Err, Ok } from '../blocks/ts/result';

/** Language support for `*.html` files. */
export const html: Lang = {
	matches: (fileName) => fileName.endsWith('.html'),
	resolveDependencies: ({ filePath, isSubDir, excludeDeps, dirs, cwd, containingDir }) => {
		const sourceCode = fs.readFileSync(filePath).toString();

		const ast = parse5.parse(sourceCode);

		const imports: string[] = [];

		// @ts-ignore yeah I know
		const walk = (node, enter: (node) => void) => {
			if (!node) return;

			enter(node);

			if (node.childNodes && node.childNodes.length > 0) {
				for (const n of node.childNodes) {
					walk(n, enter);
				}
			}
		};

		for (const node of ast.childNodes) {
			walk(node, (n) => {
				if (n.tagName === 'script') {
					for (const attr of n.attrs) {
						if (attr.name === 'src') {
							imports.push(attr.value);
						}
					}
				}

				if (
					n.tagName === 'link' &&
					// @ts-ignore yeah I know
					n.attrs.find((attr) => attr.name === 'rel' && attr.value === 'stylesheet')
				) {
					for (const attr of n.attrs) {
						if (attr.name === 'href' && !attr.value.startsWith('http')) {
							imports.push(attr.value);
						}
					}
				}
			});
		}

		const resolveResult = resolveImports({
			moduleSpecifiers: imports,
			filePath,
			isSubDir,
			dirs,
			cwd,
			containingDir,
			doNotInstall: ['svelte', '@sveltejs/kit', ...excludeDeps],
		});

		if (resolveResult.isErr()) {
			return Err(
				resolveResult
					.unwrapErr()
					.map((err) => formatError(err))
					.join('\n')
			);
		}

		return Ok(resolveResult.unwrap());
	},
	comment: (content) => `<!--\n${lines.join(lines.get(content), { prefix: () => '\t' })}\n-->`,
	format: async (code, { formatter, prettierOptions }) => {
		if (!formatter) return code;

		if (formatter === 'prettier') {
			return await prettier.format(code, { parser: 'html', ...prettierOptions });
		}

		// biome is in progress for formatting html

		return code;
	},
};
