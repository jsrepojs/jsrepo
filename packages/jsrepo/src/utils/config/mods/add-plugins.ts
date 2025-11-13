import MagicString from 'magic-string';
import { err, ok, type Result } from 'nevereverthrow';
import {
	type AssignmentTargetProperty,
	type BindingProperty,
	type ImportDeclaration,
	type ObjectExpression,
	type ObjectProperty,
	parseAsync,
	Visitor,
} from 'oxc-parser';
import { vi } from 'vitest';
import { getImports } from '@/langs/js';
import { kebabToCamel } from '@/utils/casing';
import {
	ConfigObjectNotFoundError,
	CouldNotFindJsrepoImportError,
	InvalidKeyTypeError,
	InvalidPluginError,
} from '@/utils/errors';
import { parsePackageName } from '@/utils/parse-package-name';
import type { RegistryPlugin } from '..';

class VisitorState {
	IGNORED_PROPERTIES = ['registry', 'registries', 'paths'];
	importDeclarations: ImportDeclaration[] = [];

	withinExportDefaultDeclaration = false;
	withinDefineConfig = false;
	withinMainObjectExpression = false;
	withinIgnoredProperty = false;
	lastImportDeclaration: ImportDeclaration | null = null;
	configKeyPropertyDeclaration:
		| ObjectProperty
		| AssignmentTargetProperty
		| BindingProperty
		| null = null;
	mainObjectExpression: ObjectExpression | null = null;
}

export type Plugin = {
	name: string;
	packageName: string;
	version: string | undefined;
};

export async function addPluginsToConfig({
	plugins,
	key,
	config,
}: {
	config: {
		path: string;
		code: string;
	};
	plugins: Plugin[];
	key: 'transforms' | 'providers' | 'languages';
}): Promise<
	Result<string, InvalidKeyTypeError | CouldNotFindJsrepoImportError | ConfigObjectNotFoundError>
> {
	if (plugins.length === 0) return ok(config.code);

	const parsed = await parseAsync(config.path, config.code);

	const s = new MagicString(config.code);

	const state = new VisitorState();
	state.withinDefineConfig = true;

	const visitor = new Visitor({
		ImportDeclaration(decl) {
			if (!state.withinDefineConfig) return;
			state.lastImportDeclaration = decl;
			state.importDeclarations.push(decl);
		},
		ExportDefaultDeclaration() {
			state.withinExportDefaultDeclaration = true;
		},
		'ExportDefaultDeclaration:exit'() {
			// realistically there should only be one export default declaration
			state.withinExportDefaultDeclaration = false;
		},
		ObjectExpression(expr) {
			if (!state.withinExportDefaultDeclaration) return;
			if (!state.withinDefineConfig) return;
			if (state.withinIgnoredProperty) return;
			if (state.withinMainObjectExpression) return;

			state.mainObjectExpression = expr;
			state.withinMainObjectExpression = true;
			// we don't use an exit here cause we don't have a way of knowing it's the same one
			// instead we just reset this upon exiting defineConfig
		},
		CallExpression(expr) {
			if (!state.withinExportDefaultDeclaration) return;
			if (expr.callee.type === 'Identifier') {
				if (expr.callee.name === 'defineConfig') {
					state.withinDefineConfig = true;
				}
			}
		},
		'CallExpression:exit'(expr) {
			if (!state.withinDefineConfig) return;
			if (expr.callee.type === 'Identifier') {
				if (expr.callee.name === 'defineConfig') {
					state.withinDefineConfig = false;
					state.withinMainObjectExpression = false;
				}
			}
		},
		Property(prop) {
			if (!state.withinDefineConfig) return;
			if (!state.withinMainObjectExpression) return;
			if (state.withinIgnoredProperty) return;
			if (
				state.IGNORED_PROPERTIES.includes(
					prop.key.type === 'Identifier' ? prop.key.name : ''
				)
			) {
				state.withinIgnoredProperty = true;
				return;
			}
			// locate the config key
			if (
				prop.key.type === 'Identifier' &&
				(prop.kind === 'init' || prop.kind === 'get') &&
				prop.key.name === key
			) {
				if (prop.value.type !== 'ArrayExpression')
					return err(new InvalidKeyTypeError({ key, type: 'array' }));
				state.configKeyPropertyDeclaration = prop;
			}
		},
		'Property:exit'(prop) {
			if (!state.withinDefineConfig) return;
			if (
				state.IGNORED_PROPERTIES.includes(
					prop.key.type === 'Identifier' ? prop.key.name : ''
				)
			) {
				state.withinIgnoredProperty = false;
				return;
			}
		},
	});

	visitor.visit(parsed.program);

	// filter out plugins that are already imported
	plugins = plugins.filter(
		(plugin) =>
			!state.importDeclarations.some(
				(importDeclaration) => importDeclaration.source.value === plugin.packageName
			)
	);

	if (plugins.length === 0) {
		return ok(config.code);
	}

	// add imports
	if (state.lastImportDeclaration !== null) {
		s.appendRight(
			state.lastImportDeclaration.end,
			plugins
				.map((plugin) => `\nimport ${plugin.name} from '${plugin.packageName}';`)
				.join('')
		);
	}

	let defaultsArray: string | null = null;
	if (key === 'providers') {
		defaultsArray = 'DEFAULT_PROVIDERS';
	} else if (key === 'languages') {
		defaultsArray = 'DEFAULT_LANGS';
	}
	const jsrepoImportDeclaration = state.importDeclarations.find(
		(decl) => decl.source.value === 'jsrepo'
	);
	if (jsrepoImportDeclaration === undefined) return err(new CouldNotFindJsrepoImportError());
	let defaultsArrayState: { added: boolean; name: string } | null = defaultsArray
		? { added: false, name: defaultsArray }
		: null;
	if (defaultsArrayState !== null) {
		for (const specifier of jsrepoImportDeclaration.specifiers) {
			if (specifier.type === 'ImportSpecifier') {
				if (specifier.imported.type === 'Identifier') {
					if (specifier.imported.name === defaultsArray) {
						defaultsArrayState.added = true;
						if (specifier.local.name !== defaultsArray) {
							defaultsArrayState.name = specifier.local.name;
						}
						break;
					}
				}
			}
		}
	}

	// add call expressions to the config key
	if (state.configKeyPropertyDeclaration !== null) {
		// handle object with the config key
		if (state.configKeyPropertyDeclaration.value.type !== 'ArrayExpression') {
			return err(new InvalidKeyTypeError({ key, type: 'array' }));
		}
		const code = s.slice(
			state.configKeyPropertyDeclaration.value.start,
			state.configKeyPropertyDeclaration.value.end
		);
		const lastCommaIndex = code.lastIndexOf(',');
		const lastComma =
			lastCommaIndex === -1
				? -1
				: lastCommaIndex + state.configKeyPropertyDeclaration.value.start + 1;
		if (state.configKeyPropertyDeclaration.value.elements.length === 0) {
			defaultsArrayState = null;
			s.appendRight(
				state.configKeyPropertyDeclaration.value.start + 1,
				`${plugins.map((plugin) => `${plugin.name}()`).join(', ')}`
			);
		} else {
			const lastElement =
				state.configKeyPropertyDeclaration.value.elements[
					state.configKeyPropertyDeclaration.value.elements.length - 1
				]!;

			let needsComma = false;
			if (lastComma !== -1 && lastComma > lastElement.end) {
				needsComma = false;
			} else {
				needsComma = true;
			}

			// null it out since we don't use it
			defaultsArrayState = null;
			s.appendRight(
				needsComma ? lastElement.end : lastComma,
				`${needsComma ? ',' : ''} ${plugins.map((plugin) => `${plugin.name}()`).join(', ')}`
			);
		}
	} else {
		// handle object without the config key
		if (state.mainObjectExpression === null) return err(new ConfigObjectNotFoundError());
		const code = s.slice(state.mainObjectExpression.start, state.mainObjectExpression.end);
		const lastCommaIndex = code.lastIndexOf(',');
		const lastComma =
			lastCommaIndex === -1 ? -1 : lastCommaIndex + state.mainObjectExpression.start + 1;
		if (state.mainObjectExpression.properties.length === 0) {
			s.appendRight(
				state.mainObjectExpression.start + 1,
				`\n\t${key}: [${defaultsArrayState ? `...${defaultsArrayState.name}, ` : ''}${plugins
					.map((plugin) => `${plugin.name}()`)
					.join(', ')}]`
			);
		} else {
			const lastProperty =
				state.mainObjectExpression.properties[
					state.mainObjectExpression.properties.length - 1
				]!;

			let needsComma = false;
			if (lastComma !== -1 && lastComma > lastProperty.end) {
				needsComma = false;
			} else {
				needsComma = true;
			}

			s.appendRight(
				needsComma ? lastProperty.end : lastComma,
				`${needsComma ? ',' : ''}\n\t${key}: [${
					defaultsArrayState ? `...${defaultsArrayState.name}, ` : ''
				}${plugins.map((plugin) => `${plugin.name}()`).join(', ')}]`
			);
		}

		if (defaultsArrayState && !defaultsArrayState.added) {
			const code = s.slice(jsrepoImportDeclaration.start, jsrepoImportDeclaration.end);
			const lastCommaIndex = code.lastIndexOf(',');
			const lastComma =
				lastCommaIndex === -1 ? -1 : lastCommaIndex + jsrepoImportDeclaration.start + 1;

			const lastSpecifier =
				jsrepoImportDeclaration.specifiers[jsrepoImportDeclaration.specifiers.length - 1]!;

			let needsComma = false;
			if (lastComma !== -1 && lastComma > lastSpecifier.end) {
				needsComma = false;
			} else {
				needsComma = true;
			}

			s.appendRight(
				lastComma ? lastSpecifier.end : lastComma,
				`${needsComma ? ',' : ''} ${defaultsArrayState.name}`
			);
		}
	}

	return ok(s.toString());
}

export async function neededPlugins({
	plugins,
	config,
}: {
	config: {
		path: string;
		code: string;
	};
	plugins: RegistryPlugin[];
}): Promise<RegistryPlugin[]> {
	const fn = vi.fn();
	const imports = await getImports(config.code, {
		fileName: config.path,
		cwd: process.cwd(),
		excludeDeps: [],
		warn: fn,
	});
	return plugins.filter((plugin) => !imports.includes(plugin.package));
}

export const OFFICIAL_PLUGINS = [
	{
		shorthand: 'prettier',
		name: '@jsrepo/transform-prettier',
	},
	{
		shorthand: 'biome',
		name: '@jsrepo/transform-biome',
	},
	{
		shorthand: 'javascript',
		name: '@jsrepo/transform-javascript',
	},
];

export function parsePlugins(
	plugins: string[],
	key: 'transform' | 'provider' | 'language'
): Result<Plugin[], InvalidPluginError> {
	const pluginsResult = plugins.map((plugin) => parsePluginName(plugin, key));
	const finalPlugins: Plugin[] = [];
	for (const result of pluginsResult) {
		if (result.isErr()) return err(result.error);
		finalPlugins.push(result.value);
	}
	return ok(finalPlugins);
}

export function parsePluginName(
	plugin: string,
	key: 'transform' | 'provider' | 'language'
): Result<Plugin, InvalidPluginError> {
	const officialPlugin = OFFICIAL_PLUGINS.find((p) => p.shorthand === plugin);
	if (officialPlugin) {
		const parsedPlugin = parsePluginName(officialPlugin.name, key);
		if (parsedPlugin.isErr()) return err(parsedPlugin.error);
		return ok({
			name: parsedPlugin.value.name,
			packageName: officialPlugin.name,
			version: undefined,
		});
	}

	const parsedPackage = parsePackageName(plugin);
	if (parsedPackage.isErr()) return err(new InvalidPluginError(plugin));

	let name = parsedPackage.value.name;
	if (parsedPackage.value.name.startsWith('@')) {
		if (parsedPackage.value.name.startsWith('@jsrepo/')) {
			// add jsrepo- prefix back to official plugins
			// instead of @jsrepo/transform-prettier
			// we want jsrepo-transform-prettier
			name = `jsrepo-${parsedPackage.value.name.split('/')[1]!}`;
		} else {
			// use the second portion of the name
			// instead of @example/jsrepo-transform-prettier
			// we want jsrepo-transform-prettier
			name = parsedPackage.value.name.split('/')[1]!;
		}
	}

	return ok({
		name: kebabToCamel(name.replace(`jsrepo-${key}-`, '')),
		packageName: parsedPackage.value.name,
		version: parsedPackage.value.version,
	});
}
