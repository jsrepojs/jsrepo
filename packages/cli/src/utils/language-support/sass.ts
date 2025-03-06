import fs from 'node:fs';
import * as cssDependency from 'css-dependency';
import * as prettier from 'prettier';
import { type Lang, formatError, resolveImports } from '.';
import * as lines from '../blocks/ts/lines';
import { Err, Ok } from '../blocks/ts/result';

/** Language support for `*.(sass|scss)` files. */
export const sass: Lang = {
	matches: (fileName) => fileName.endsWith('.sass') || fileName.endsWith('.scss'),
	resolveDependencies: ({ filePath, isSubDir, excludeDeps, dirs, cwd, containingDir }) => {
		const sourceCode = fs.readFileSync(filePath).toString();

		const parseResult = cssDependency.parse(sourceCode);

		if (parseResult.isErr()) {
			return Err(parseResult.unwrapErr().message);
		}

		const imports = parseResult.unwrap();

		const resolveResult = resolveImports({
			moduleSpecifiers: imports.map((imp) => imp.module),
			filePath,
			isSubDir,
			dirs,
			cwd,
			containingDir,
			doNotInstall: excludeDeps,
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
	comment: (content) => `/*\n${lines.join(lines.get(content), { prefix: () => '\t' })}\n*/`,
	format: async (code, { formatter, prettierOptions }) => {
		if (!formatter) return code;

		if (formatter === 'prettier') {
			return await prettier.format(code, { parser: 'scss', ...prettierOptions });
		}

		return code;
	},
};
