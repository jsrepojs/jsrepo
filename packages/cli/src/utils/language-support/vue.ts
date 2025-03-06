import fs from 'node:fs';
import * as prettier from 'prettier';
import * as v from 'vue/compiler-sfc';
import { type Lang, formatError, resolveImports } from '.';
import * as lines from '../blocks/ts/lines';
import { Err, Ok } from '../blocks/ts/result';

/** Language support for `*.vue` files. */
export const vue: Lang = {
	matches: (fileName) => fileName.endsWith('.vue'),
	resolveDependencies: ({ filePath, isSubDir, excludeDeps, dirs, cwd, containingDir }) => {
		const sourceCode = fs.readFileSync(filePath).toString();

		const parsed = v.parse(sourceCode, { filename: filePath });

		if (!parsed.descriptor.script?.content && !parsed.descriptor.scriptSetup?.content)
			return Ok({ dependencies: [], devDependencies: [], local: [], imports: {} });

		let compiled: v.SFCScriptBlock;
		try {
			compiled = v.compileScript(parsed.descriptor, {
				id: 'shut-it',
			}); // you need this id to remove a warning
		} catch (err) {
			return Err(`Compile error: ${err}`);
		}

		if (!compiled.imports)
			return Ok({ dependencies: [], devDependencies: [], local: [], imports: {} });

		const imports = Object.values(compiled.imports).map((imp) => imp.source);

		const resolveResult = resolveImports({
			moduleSpecifiers: imports,
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
