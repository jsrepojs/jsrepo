import fs from 'node:fs';
import { builtinModules } from 'node:module';
import { Biome, Distribution } from '@biomejs/js-api';
import type { PartialConfiguration } from '@biomejs/wasm-nodejs';
import color from 'chalk';
import { type Node, walk } from 'estree-walker';
import { type TsConfigResult, createPathsMatcher, getTsconfig } from 'get-tsconfig';
import * as parse5 from 'parse5';
import path from 'pathe';
import * as prettier from 'prettier';
import * as sv from 'svelte/compiler';
import { Project } from 'ts-morph';
import validatePackageName from 'validate-npm-package-name';
import * as v from 'vue/compiler-sfc';
import * as ascii from './ascii';
import { Err, Ok, type Result } from './blocks/types/result';
import * as lines from './blocks/utils/lines';
import type { Formatter } from './config';
import { findNearestPackageJson } from './package';
import { parsePackageName } from './parse-package-name';

export type ResolvedDependencies = {
	local: string[];
	devDependencies: string[];
	dependencies: string[];
	/** Maps a literal import to a template import to be replaced during add/update */
	imports: Record<string, string>;
};

export type ResolveDependencyOptions = {
	filePath: string;
	/** Only valid for folder based blocks. Helps identify a self dependency */
	containingDir?: string;
	isSubDir: boolean;
	excludeDeps: string[];
	cwd: string;
	dirs: string[];
};

export type FormatOptions = {
	formatter?: Formatter;
	/** Can be used to infer the prettier parser */
	filePath: string;
	prettierOptions: prettier.Options | null;
	biomeOptions: PartialConfiguration | null;
};

export type Lang = {
	/** Matches the supported file types */
	matches: (fileName: string) => boolean;
	/** Reads the file and gets any dependencies from its imports */
	resolveDependencies: (opts: ResolveDependencyOptions) => Result<ResolvedDependencies, string>;
	/** Returns a multiline comment containing the content */
	comment: (content: string) => string;
	format: (code: string, opts: FormatOptions) => Promise<string>;
};

/** Language support for `*.css` files. */
const css: Lang = {
	matches: (fileName) => fileName.endsWith('.css'),
	resolveDependencies: () =>
		Ok({ dependencies: [], local: [], devDependencies: [], imports: {} }),
	comment: (content) => `/*\n${lines.join(lines.get(content), { prefix: () => '\t' })}\n*/`,
	format: async (code, { formatter, prettierOptions, biomeOptions, filePath }) => {
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

/** Language support for `*.html` files. */
const html: Lang = {
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

/** Language support for `*.(json)` files. */
const json: Lang = {
	matches: (fileName) => fileName.endsWith('.json'),
	resolveDependencies: () =>
		Ok({ dependencies: [], local: [], devDependencies: [], imports: {} }),
	// json doesn't support comments
	comment: (content: string) => content,
	format: async (code, { formatter, prettierOptions, biomeOptions, filePath }) => {
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

/** Language support for `*.(jsonc)` files. */
const jsonc: Lang = {
	matches: (fileName) => fileName.endsWith('.jsonc'),
	resolveDependencies: () =>
		Ok({ dependencies: [], local: [], devDependencies: [], imports: {} }),
	comment: (content) => `/*\n${lines.join(lines.get(content), { prefix: () => '\t' })}\n*/`,
	format: async (code, { formatter, prettierOptions, biomeOptions, filePath }) => {
		if (!formatter) return code;

		if (formatter === 'prettier') {
			return await prettier.format(code, { filepath: filePath, ...prettierOptions });
		}

		const biome = await Biome.create({
			distribution: Distribution.NODE,
		});

		if (biomeOptions) {
			biome.applyConfiguration({
				...biomeOptions,
				json: { parser: { allowComments: true } },
			});
		}

		return biome.formatContent(code, { filePath }).content;
	},
};

/** Language support for `*.(sass|scss)` files. */
const sass: Lang = {
	matches: (fileName) => fileName.endsWith('.sass') || fileName.endsWith('.scss'),
	resolveDependencies: () =>
		Ok({ dependencies: [], local: [], devDependencies: [], imports: {} }),
	comment: (content) => `/*\n${lines.join(lines.get(content), { prefix: () => '\t' })}\n*/`,
	format: async (code, { formatter, prettierOptions }) => {
		if (!formatter) return code;

		if (formatter === 'prettier') {
			return await prettier.format(code, { parser: 'scss', ...prettierOptions });
		}

		return code;
	},
};

/** Language support for `*.svelte` files. */
const svelte: Lang = {
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
			return await prettier.format(code, { filepath: filePath, ...prettierOptions });
		}

		return code;
	},
};

/** Language support for `*.svg` files. */
const svg: Lang = {
	matches: (fileName) => fileName.endsWith('.svg'),
	resolveDependencies: () =>
		Ok({ dependencies: [], local: [], devDependencies: [], imports: {} }),
	comment: (content) => `<!--\n${lines.join(lines.get(content), { prefix: () => '\t' })}\n-->`,
	format: async (code) => code,
};

/** Language support for `*.(js|ts|jsx|tsx)` files. */
const typescript: Lang = {
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

/** Language support for `*.vue` files. */
const vue: Lang = {
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

/** Language support for `*.(yaml|yml)` files. */
const yaml: Lang = {
	matches: (fileName) => fileName.endsWith('.yml') || fileName.endsWith('.yaml'),
	resolveDependencies: () =>
		Ok({ dependencies: [], local: [], devDependencies: [], imports: {} }),
	comment: (content: string) => lines.join(lines.get(content), { prefix: () => '# ' }),
	format: async (code, { formatter, prettierOptions }) => {
		if (!formatter) return code;

		if (formatter === 'prettier') {
			return await prettier.format(code, { parser: 'yaml', ...prettierOptions });
		}

		return code;
	},
};

export type ResolveImportOptions = {
	moduleSpecifiers: string[];
	isSubDir: boolean;
	filePath: string;
	/** Only valid for folder based blocks. Helps identify a self dependency */
	containingDir?: string;
	doNotInstall?: string[];
	dirs: string[];
	cwd: string;
};

const formatError = (err: string) => {
	return `${lines.join(lines.get(err), {
		prefix: (l) => {
			if (l === 0) return `${ascii.VERTICAL_LINE}  ${ascii.ERROR} `;

			return `${ascii.VERTICAL_LINE}  `;
		},
	})}`;
};

const resolveImports = ({
	moduleSpecifiers,
	isSubDir,
	filePath,
	containingDir,
	doNotInstall,
	dirs,
	cwd,
}: ResolveImportOptions): Result<ResolvedDependencies, string[]> => {
	const errors: string[] = [];

	const deps = new Set<string>();
	const localDeps = new Set<string>();
	const imports: Record<string, string> = {};

	for (const specifier of moduleSpecifiers) {
		if (specifier.startsWith('.')) {
			const localDep = resolveLocalImport(specifier, isSubDir, {
				filePath,
				containingDir,
				dirs,
				cwd,
			});

			if (localDep.isErr()) {
				errors.push(localDep.unwrapErr());
				continue;
			}

			const dep = localDep.unwrap();

			if (dep) {
				localDeps.add(dep.dependency);
				imports[specifier] = dep.template;
			}

			continue;
		}

		const localDep = tryResolveLocalAlias(specifier, isSubDir, {
			filePath,
			containingDir,
			dirs,
			cwd,
		});

		if (localDep.isErr()) {
			errors.push(localDep.unwrapErr());
			continue;
		}

		const dep = localDep.unwrap();

		if (dep) {
			localDeps.add(dep.dependency);
			imports[specifier] = dep.template;
		} else {
			deps.add(specifier);
		}
	}

	if (errors.length > 0) {
		return Err(errors);
	}

	const { devDependencies, dependencies } = resolveRemoteDeps(Array.from(deps), filePath, {
		doNotInstall: doNotInstall ? doNotInstall : [],
	});

	return Ok({
		dependencies,
		devDependencies,
		local: Array.from(localDeps),
		imports,
	} satisfies ResolvedDependencies);
};

type ResolveLocalImportResult = {
	/** The local block that is a dependency */
	dependency: string;
	/** A template used to resolve the import during add/update */
	template: string;
};

const resolveLocalImport = (
	mod: string,
	isSubDir: boolean,
	{
		filePath,
		containingDir,
		dropExtension = true,
		alias,
		dirs,
		cwd,
	}: {
		filePath: string;
		containingDir?: string;
		dirs: string[];
		alias?: string;
		modIsFile?: boolean;
		cwd: string;
		dropExtension?: boolean;
	}
): Result<ResolveLocalImportResult | undefined, string> => {
	if (isSubDir && (mod.startsWith('./') || mod === '.')) return Ok(undefined);

	// get the path to the current category
	// if the block is a subdirectory block then containing dir must exist
	const categoryDir = isSubDir ? path.join(containingDir!, '../') : path.join(filePath, '../');

	// get the actual path to the module
	const modPath = path.join(path.join(filePath, '../'), mod);

	// get the full path to the current category containing folder
	const fullDir = path.join(categoryDir, '../');

	// prevent self reference in subdirectories
	if (containingDir && modPath.startsWith(containingDir)) return Ok(undefined);

	if (modPath.startsWith(fullDir)) {
		return Ok(parsePath(modPath.slice(fullDir.length), dropExtension));
	}

	for (const dir of dirs) {
		const containingPath = path.resolve(path.join(cwd, dir));
		const absPath = path.resolve(modPath);

		if (absPath.startsWith(containingPath)) {
			return Ok(parsePath(absPath.slice(containingPath.length + 1), dropExtension));
		}
	}

	return Err(
		`${filePath}:\n${alias ? alias : mod} references code not contained in ${color.bold(dirs.join(', '))} and cannot be resolved.`
	);
};

const parsePath = (localPath: string, dropExtension = true): ResolveLocalImportResult => {
	let [category, block, ...rest] = localPath.split('/');

	// if undefined we assume we are pointing to the index file
	if (block === undefined) {
		block = 'index';
	}

	let trimmedBlock = block;

	// remove file extension
	if (dropExtension && trimmedBlock.includes('.')) {
		trimmedBlock = trimmedBlock.slice(
			0,
			trimmedBlock.length - path.parse(trimmedBlock).ext.length
		);
	}

	const blockSpecifier = `${category}/${trimmedBlock}`;

	let template = `{{${blockSpecifier}}}`;

	if (rest.length === 0) {
		if (trimmedBlock.length !== block.length) {
			// add extension to template
			template += path.parse(block).ext;
		}
	} else {
		template += `/${rest.join('/')}`;
	}

	return { dependency: blockSpecifier, template };
};

/** Tries to resolve the modules as an alias using the tsconfig. */
const tryResolveLocalAlias = (
	mod: string,
	isSubDir: boolean,
	{
		filePath,
		dirs,
		cwd,
		containingDir,
	}: { filePath: string; containingDir?: string; dirs: string[]; cwd: string }
): Result<ResolveLocalImportResult | undefined, string> => {
	let config: TsConfigResult | null;

	try {
		config = getTsconfig(filePath, 'tsconfig.json');

		if (!config) {
			// if we don't find the config at first check for a jsconfig
			config = getTsconfig(filePath, 'jsconfig.json');

			if (!config) {
				return Ok(undefined);
			}
		}
	} catch (err) {
		return Err(`Error while trying to get ${color.bold('tsconfig.json')}: ${err}`);
	}

	const matcher = createPathsMatcher(config);

	if (matcher) {
		// if the mod is actually remote the returns paths will be empty
		const paths = matcher(mod);

		for (const modPath of paths) {
			const foundMod = searchForModule(modPath);

			if (!foundMod) continue;

			const pathResolved = path.relative(
				path.resolve(path.join(filePath, '../')),
				foundMod.prettyPath
			);

			// if it is not equal the extension has already been dropped
			// we omit the '' extension because it there is no extension there is nothing to be dropped
			const shouldDropExtension = resolutionEquality(foundMod.prettyPath, foundMod.path, [
				'.js',
				'.ts',
			]);

			const localDep = resolveLocalImport(pathResolved, isSubDir, {
				filePath,
				containingDir,
				alias: mod,
				dropExtension: shouldDropExtension,
				dirs,
				cwd,
				modIsFile: foundMod.type === 'file',
			});

			if (localDep.isErr()) return Err(localDep.unwrapErr());

			if (localDep.unwrap()) return Ok(localDep.unwrap()!);

			break;
		}
	}

	return Ok(undefined);
};

/** Node allows no extension or a .js extension or a .ts extension to all resolve to the same place because of this we employ a different method of equality.
 *
 *  Basically we want to treat a path with a .js extension as equal to the same path with a .ts extension and vise versa.
 */
const resolutionEquality = (pathA: string, pathB: string, validExtensions = ['.ts', '.js', '']) => {
	if (pathA === pathB) return true;

	const parsedA = path.parse(pathA);
	const parsedB = path.parse(pathB);

	const pathAWithoutExtension = path.join(parsedA.dir, parsedA.name);
	const pathBWithoutExtension = path.join(parsedB.dir, parsedB.name);

	// if paths without extension aren't equal then return false
	if (pathAWithoutExtension !== pathBWithoutExtension) return false;

	// as long as both paths have a .js or .ts extension we can be sure that they are equal
	if (validExtensions.includes(parsedA.ext) && validExtensions.includes(parsedB.ext)) return true;

	return false;
};

/** Searches around for the module
 *
 * @param path
 */
const searchForModule = (
	modPath: string
): { path: string; prettyPath: string; type: 'file' | 'directory' } | undefined => {
	if (fs.existsSync(modPath)) {
		return {
			path: modPath,
			prettyPath: modPath,
			type: fs.statSync(modPath).isDirectory() ? 'directory' : 'file',
		};
	}

	const containing = path.join(modPath, '../');

	// if containing folder doesn't exist this can't exist
	if (!fs.existsSync(containing)) return undefined;

	const modParsed = path.parse(modPath);

	// sometimes it will point to .js because it will resolve in prod but not for us
	if (modParsed.ext === '.js') {
		const newPath = `${modPath.slice(0, modPath.length - 3)}.ts`;

		if (fs.existsSync(newPath)) return { path: newPath, prettyPath: modPath, type: 'file' };
	}

	const files = fs.readdirSync(containing);

	for (const file of files) {
		const fileParsed = path.parse(file);

		// this way the extension doesn't matter
		if (fileParsed.name === modParsed.base) {
			const filePath = path.join(containing, file);

			// we remove the extension since it wasn't included by the user
			const prettyPath = filePath.slice(0, filePath.length - fileParsed.ext.length);

			return {
				path: filePath,
				prettyPath: prettyPath,
				type: fs.statSync(filePath).isDirectory() ? 'directory' : 'file',
			};
		}
	}

	return undefined;
};

/** Iterates over the dependency and resolves each one using the nearest package.json file.
 * Strips node APIs and pins the version of each dependency based on what is in the package.json.
 *
 * @param deps
 * @param filePath
 * @returns
 */
const resolveRemoteDeps = (
	deps: string[],
	filePath: string,
	{ doNotInstall }: { doNotInstall: string[] } = {
		doNotInstall: [],
	}
) => {
	const exemptDeps = new Set(doNotInstall);

	const filteredDeps = deps.filter(
		(dep) => !builtinModules.includes(dep) && !dep.startsWith('node:')
	);

	const pkgPath = findNearestPackageJson(path.dirname(filePath), '');

	const dependencies = new Set<string>();
	const devDependencies = new Set<string>();

	if (pkgPath) {
		const { devDependencies: packageDevDependencies, dependencies: packageDependencies } =
			JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

		for (const dep of filteredDeps) {
			const parsed = parsePackageName(dep);

			if (parsed.isErr()) {
				console.warn(
					`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped adding import \`${color.cyan(dep)}\`. Reason: Couldn't parse package name`
				);
				continue;
			}

			const depInfo = parsed.unwrap();

			if (!validatePackageName(depInfo.name).validForNewPackages) {
				console.warn(
					`${ascii.VERTICAL_LINE}  ${ascii.WARN} Skipped adding import \`${color.cyan(dep)}\`. Reason: Not a valid package name`
				);
				continue;
			}

			if (exemptDeps.has(depInfo.name)) continue;

			let version: string | undefined = undefined;
			if (packageDependencies !== undefined) {
				version = packageDependencies[depInfo.name];
			}

			if (version !== undefined) {
				dependencies.add(`${depInfo.name}@${version}`);
				continue;
			}

			if (packageDevDependencies !== undefined) {
				version = packageDevDependencies[depInfo.name];
			}

			if (version !== undefined) {
				devDependencies.add(`${depInfo.name}@${version}`);
				continue;
			}

			// if no version found just add it without a version
			dependencies.add(depInfo.name);
		}
	}

	return {
		dependencies: Array.from(dependencies),
		devDependencies: Array.from(devDependencies),
	};
};

const languages: Lang[] = [css, html, json, jsonc, sass, svelte, svg, typescript, vue, yaml];

export {
	css,
	html,
	json,
	jsonc,
	sass,
	svelte,
	svg,
	typescript,
	vue,
	yaml,
	languages,
	resolutionEquality,
};
