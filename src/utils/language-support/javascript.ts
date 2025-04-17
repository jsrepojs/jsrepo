import fs from 'node:fs';
import { Biome, Distribution } from '@biomejs/js-api';
import oxc from 'oxc-parser';
import * as prettier from 'prettier';
import { type Lang, formatError, resolveImports } from '.';
import * as lines from '../blocks/ts/lines';
import { Err, Ok } from '../blocks/ts/result';

/** Parses the provided code and returns the names of any other modules required by the module.
 *
 * @param fileName This must be provided for oxc to infer the dialect i.e. (jsx, tsx, js, ts)
 * @param code The code to be parsed
 * @returns
 */
export function getJavascriptImports(fileName: string, code: string): string[] {
	const result = oxc.parseSync(fileName, code);

	const modules: string[] = [];

	// handle static imports
	for (const imp of result.module.staticImports) {
		modules.push(imp.moduleRequest.value);
	}

	// handle dynamic imports
	for (const imp of result.module.dynamicImports) {
		// trims the codes and gets the module
		const mod = code.slice(imp.moduleRequest.start + 1, imp.moduleRequest.end - 1);

		modules.push(mod);
	}

	// handle `export x from y` syntax
	for (const exp of result.module.staticExports) {
		for (const entry of exp.entries) {
			if (entry.moduleRequest) {
				modules.push(entry.moduleRequest.value);
			}
		}
	}

	return modules;
}

/** Language support for `*.(js|ts|jsx|tsx)` files. */
export const typescript: Lang = {
	matches: (fileName) =>
		fileName.endsWith('.ts') ||
		fileName.endsWith('.js') ||
		fileName.endsWith('.tsx') ||
		fileName.endsWith('.jsx'),
	resolveDependencies: ({ filePath, isSubDir, excludeDeps, dirs, cwd, containingDir }) => {
		const code = fs.readFileSync(filePath).toString();

		const modules = getJavascriptImports(filePath, code);

		const resolveResult = resolveImports({
			moduleSpecifiers: modules,
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
	format: async (code, { formatter, filePath, prettierOptions, biomeOptions }) => {
		if (!formatter) return code;

		if (formatter === 'prettier') {
			return await prettier.format(code, { filepath: filePath, ...prettierOptions });
		}

		const biome = await Biome.create({
			distribution: Distribution.NODE,
		});

		if (biomeOptions) {
			biome.applyConfiguration(biomeOptions);
		}

		return biome.formatContent(code, { filePath }).content;
	},
};
