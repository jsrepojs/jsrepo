import fs from 'node:fs';
import * as prettier from 'prettier';
import * as v from 'vue/compiler-sfc';
import { type Lang, formatError, resolveImports } from '.';
import * as lines from '../blocks/ts/lines';
import { Err, Ok } from '../blocks/ts/result';
import { getJavascriptImports } from './javascript';

/** Language support for `*.vue` files. */
export const vue: Lang = {
	matches: (fileName) => fileName.endsWith('.vue'),
	resolveDependencies: ({ filePath, isSubDir, excludeDeps, dirs, cwd, containingDir }) => {
		const code = fs.readFileSync(filePath).toString();

		const parsed = v.parse(code, { filename: filePath });

		const modules: string[] = [];

		if (parsed.descriptor.script?.content) {
			const mods = getJavascriptImports('noop.ts', parsed.descriptor.script.content);

			modules.push(...mods);
		}

		if (parsed.descriptor.scriptSetup?.content) {
			const mods = getJavascriptImports('noop.ts', parsed.descriptor.scriptSetup.content);

			modules.push(...mods);
		}

		if (modules.length === 0)
			return Ok({ dependencies: [], devDependencies: [], local: [], imports: {} });

		const resolveResult = resolveImports({
			moduleSpecifiers: modules,
			filePath,
			isSubDir,
			dirs,
			cwd,
			containingDir,
			doNotInstall: ['vue', 'nuxt', ...excludeDeps],
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
			return await prettier.format(code, { parser: 'vue', ...prettierOptions });
		}

		// biome has issues with vue support
		return code;
	},
};
