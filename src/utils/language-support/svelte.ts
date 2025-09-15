import fs from 'node:fs';
import { type Node, walk } from 'estree-walker';
import * as prettier from 'prettier';
import * as sv from 'svelte/compiler';
import * as lines from '../blocks/ts/lines';
import { Err, Ok } from '../blocks/ts/result';
import { formatError, type Lang, resolveImports } from '.';

/** Language support for `*.svelte` files. */
export const svelte: Lang = {
	matches: (fileName) => fileName.endsWith('.svelte'),
	resolveDependencies: ({ filePath, isSubDir, excludeDeps, dirs, cwd, containingDir }) => {
		const sourceCode = fs.readFileSync(filePath).toString();

		const root = sv.parse(sourceCode, { modern: true, filename: filePath });

		// if no script tag then no dependencies
		if (!root.instance && !root.module)
			return Ok({ dependencies: [], devDependencies: [], local: [], imports: {} });

		const modules: string[] = [];

		const enter = (node: Node) => {
			if (
				node.type === 'ImportDeclaration' ||
				node.type === 'ExportAllDeclaration' ||
				node.type === 'ExportNamedDeclaration'
			) {
				if (typeof node.source?.value === 'string') {
					modules.push(node.source.value);
				}
			}

			if (node.type === 'ImportExpression') {
				if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
					modules.push(node.source.value);
				}
			}
		};

		if (root.instance) {
			// biome-ignore lint/suspicious/noExplicitAny: The root instance is just missing the `id` prop
			walk(root.instance as any, { enter });
		}

		if (root.module) {
			// biome-ignore lint/suspicious/noExplicitAny: The root instance is just missing the `id` prop
			walk(root.module as any, { enter });
		}

		const resolveResult = resolveImports({
			moduleSpecifiers: modules,
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
	format: async (code, { formatter, filePath, prettierOptions }) => {
		if (!formatter) return code;

		// only attempt to format if svelte plugin is included in the config.
		if (
			formatter === 'prettier' &&
			prettierOptions &&
			prettierOptions.plugins?.find((plugin) => plugin === 'prettier-plugin-svelte')
		) {
			return await prettier.format(code, {
				filepath: filePath,
				...prettierOptions,
			});
		}

		return code;
	},
};
