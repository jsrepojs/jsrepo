import { Biome, Distribution } from '@biomejs/js-api';
import * as prettier from 'prettier';
import { Project, type StringLiteral, SyntaxKind } from 'ts-morph';
import { type Lang, formatError, resolveImports } from '.';
import * as lines from '../blocks/ts/lines';
import { Err, Ok } from '../blocks/ts/result';

/** Language support for `*.(js|ts|jsx|tsx)` files. */
export const typescript: Lang = {
	matches: (fileName) =>
		fileName.endsWith('.ts') ||
		fileName.endsWith('.js') ||
		fileName.endsWith('.tsx') ||
		fileName.endsWith('.jsx'),
	resolveDependencies: ({ filePath, isSubDir, excludeDeps, dirs, cwd, containingDir }) => {
		const project = new Project();

		const blockFile = project.addSourceFileAtPath(filePath);

		// get import specifiers
		const modules = blockFile
			.getImportDeclarations()
			.map((imp) => imp.getModuleSpecifierValue());

		// get dynamic imports
		const functions = blockFile.getDescendantsOfKind(SyntaxKind.CallExpression);
		for (const func of functions) {
			const expr = func.getExpression();

			if (expr.getKind() === SyntaxKind.ImportKeyword) {
				const specifier = func.getArguments()[0];

				if (specifier.getKind() === SyntaxKind.StringLiteral) {
					modules.push((specifier as StringLiteral).getLiteralValue());
				}
			}
		}

		// get `export x from` specifiers
		const exps = blockFile
			.getExportDeclarations()
			.map((imp) => imp.getModuleSpecifierValue())
			.filter((imp) => imp !== undefined);

		modules.push(...exps);

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
