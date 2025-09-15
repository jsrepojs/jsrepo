import fs from 'node:fs';
import { Biome, Distribution } from '@biomejs/js-api';
import * as cssDependency from 'css-dependency';
import * as prettier from 'prettier';
import * as lines from '../blocks/ts/lines';
import { Err, Ok } from '../blocks/ts/result';
import { formatError, type Lang, resolveImports } from '.';

/** Language support for `*.css` files. */
export const css: Lang = {
	matches: (fileName) => fileName.endsWith('.css'),
	resolveDependencies: ({ filePath, isSubDir, excludeDeps, dirs, cwd, containingDir }) => {
		const sourceCode = fs.readFileSync(filePath).toString();

		const parseResult = cssDependency.parse(sourceCode, { allowTailwindDirectives: true });

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
	format: async (code, { formatter, prettierOptions, biomeOptions, filePath, cwd }) => {
		if (!formatter) return code;

		if (formatter === 'prettier') {
			return await prettier.format(code, { filepath: filePath, ...prettierOptions });
		}

		const biome = await Biome.create({
			distribution: Distribution.NODE,
		});

		const { projectKey } = biome.openProject(cwd);

		if (biomeOptions) {
			biome.applyConfiguration(projectKey, biomeOptions);
		}

		return biome.formatContent(projectKey, code, { filePath }).content;
	},
};
