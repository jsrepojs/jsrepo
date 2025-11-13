import * as parse5 from 'parse5';
import { getImports, installDependencies, resolveImports, transformImports } from '@/langs/js';
import type { Language } from '@/langs/types';

export type HtmlOptions = {
	scripts: {
		/**
		 * Whether to resolve the src attribute of a script tag as a dependency.
		 * @default true
		 */
		resolveSrc: boolean;
		/**
		 * Whether to resolve dependencies within the code of a script tag.
		 * @default true
		 */
		resolveCode: boolean;
	};
	/**
	 * Whether to resolve the href attribute of a link tag as a dependency.
	 * @default true
	 */
	resolveLinks: boolean;
};

// Minimal type definition for parse5 nodes
interface HtmlAttribute {
	name: string;
	value: string;
}

interface HtmlNode {
	tagName?: string;
	attrs?: HtmlAttribute[];
	childNodes?: HtmlNode[];
}

/**
 * Detect dependencies in `.html` files by parsing script src attributes and code and link href attributes.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import { html } from "jsrepo/langs";
 *
 * export default defineConfig({
 *  // ...
 *  languages: [html()],
 * });
 * ```
 *
 * @param options - The options for the language plugin.
 */
export function html({
	scripts = { resolveSrc: true, resolveCode: true },
	resolveLinks = true,
}: Partial<HtmlOptions> = {}): Language {
	return {
		name: 'html',
		canResolveDependencies: (fileName) => fileName.endsWith('.html'),
		resolveDependencies: async (code, opts) => {
			const ast = parse5.parse(code) as unknown as HtmlNode;

			const imports: string[] = [];

			// Walk the AST tree to find imports
			const walk = async (
				node: HtmlNode | undefined,
				enter: (node: HtmlNode) => Promise<void>
			): Promise<void> => {
				if (!node) return;

				await enter(node);

				if (node.childNodes && node.childNodes.length > 0) {
					for (const n of node.childNodes) {
						await walk(n, enter);
					}
				}
			};

			if (ast.childNodes) {
				for (const node of ast.childNodes) {
					await walk(node, async (n) => {
						// Extract script src attributes
						if (n.tagName === 'script') {
							if (n.childNodes !== undefined) {
								if (scripts.resolveCode) {
									const codeNode = n.childNodes[0];
									if (codeNode && 'nodeName' in codeNode && 'value' in codeNode) {
										const code = codeNode.value as string;
										const imps = await getImports(code, {
											...opts,
											fileName: `${opts.fileName}.ts`,
										});
										imports.push(...imps);
									}
								}
							} else {
								if (scripts.resolveSrc) {
									for (const attr of n.attrs || []) {
										if (attr.name === 'src') {
											imports.push(attr.value);
										}
									}
								}
							}
						}

						// Extract stylesheet link href attributes
						if (
							resolveLinks &&
							n.tagName === 'link' &&
							n.attrs?.find(
								(attr) => attr.name === 'rel' && attr.value === 'stylesheet'
							)
						) {
							for (const attr of n.attrs) {
								if (attr.name === 'href' && !attr.value.startsWith('http')) {
									imports.push(attr.value);
								}
							}
						}
					});
				}
			}

			return resolveImports(imports, opts);
		},
		transformImports: async (imports, opts) => transformImports(imports, opts),
		canInstallDependencies: (ecosystem) => ecosystem === 'js',
		installDependencies: async (deps, opts) => installDependencies(deps, opts),
	};
}
