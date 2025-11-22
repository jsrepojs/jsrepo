import MagicString from 'magic-string';
import { err, ok, type Result } from 'nevereverthrow';
import {
	type AssignmentTargetProperty,
	type BindingProperty,
	type ObjectExpression,
	type ObjectProperty,
	parseAsync,
	Visitor,
} from 'oxc-parser';
import type { Config } from '@/utils/config';
import { ConfigObjectNotFoundError, InvalidKeyTypeError } from '@/utils/errors';
import { VALID_VARIABLE_NAME_REGEX } from '../utils';

class VisitorState {
	withinExportDefaultDeclaration = false;
	withinDefineConfig = false;
	withinMainObjectExpression = false;
	withinIgnoredProperty = false;
	configKeyPropertyDeclaration:
		| ObjectProperty
		| AssignmentTargetProperty
		| BindingProperty
		| null = null;
	mainObjectExpression: ObjectExpression | null = null;
}

export async function updateConfigPaths(
	paths: Config['paths'],
	{ config }: { config: { path: string; code: string } }
): Promise<Result<string, InvalidKeyTypeError | ConfigObjectNotFoundError>> {
	if (Object.keys(paths).length === 0) return ok(config.code);

	const parsed = await parseAsync(config.path, config.code);

	const s = new MagicString(config.code);

	const state = new VisitorState();
	state.withinDefineConfig = true;

	const visitor = new Visitor({
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
			if (prop.key.type === 'Identifier' && prop.key.name !== 'paths') {
				state.withinIgnoredProperty = true;
				return;
			}
			// locate the config key
			if (
				prop.key.type === 'Identifier' &&
				(prop.kind === 'init' || prop.kind === 'get') &&
				prop.key.name === 'paths'
			) {
				if (prop.value.type !== 'ObjectExpression')
					return err(new InvalidKeyTypeError({ key: 'paths', type: 'object' }));
				state.configKeyPropertyDeclaration = prop;
			}
		},
		'Property:exit'(prop) {
			if (!state.withinDefineConfig) return;
			if (prop.key.type === 'Identifier' && prop.key.name !== 'paths') {
				state.withinIgnoredProperty = false;
				return;
			}
		},
	});

	visitor.visit(parsed.program);

	// add call expressions to the config key
	if (state.configKeyPropertyDeclaration !== null) {
		// handle object with the config key
		if (state.configKeyPropertyDeclaration.value.type !== 'ObjectExpression') {
			return err(new InvalidKeyTypeError({ key: 'paths', type: 'object' }));
		}

		const propsToOverwrite = new Map<string, ObjectProperty>();

		for (const property of state.configKeyPropertyDeclaration.value.properties) {
			if (
				property.type === 'Property' &&
				(property.key.type === 'Literal' || property.key.type === 'Identifier')
			) {
				const key = s.slice(property.key.start, property.key.end).replaceAll(/['"]/g, '');
				if (paths[key] !== undefined) {
					propsToOverwrite.set(key, property);
				}
			}
		}

		const code = s.slice(
			state.configKeyPropertyDeclaration.value.start,
			state.configKeyPropertyDeclaration.value.end
		);

		if (state.configKeyPropertyDeclaration.value.properties.length === 0) {
			// easy path for no properties
			s.overwrite(
				state.configKeyPropertyDeclaration.value.start,
				state.configKeyPropertyDeclaration.value.end,
				`{\n${Object.entries(paths)
					.map(
						([key, value]) =>
							`\t\t${VALID_VARIABLE_NAME_REGEX.test(key) ? key : `'${key}'`}: '${value}'`
					)
					.join(',\n')}\n\t}`
			);
		} else {
			const lastProperty =
				state.configKeyPropertyDeclaration.value.properties[
					state.configKeyPropertyDeclaration.value.properties.length - 1
				]!;
			const lastCommaIndex = code.lastIndexOf(',');
			const lastComma =
				lastCommaIndex === -1
					? -1
					: lastCommaIndex + state.configKeyPropertyDeclaration.value.start + 1;

			let needsComma = false;
			if (lastComma !== -1 && lastComma > lastProperty.end) {
				needsComma = false;
			} else {
				needsComma = true;
			}

			for (const [type, path] of Object.entries(paths)) {
				const overwrittenProperty = propsToOverwrite.get(type);
				if (overwrittenProperty !== undefined) {
					// overwrite property value only
					s.overwrite(
						overwrittenProperty.value.start,
						overwrittenProperty.value.end,
						`'${path}'`
					);

					delete paths[type];
				}
			}

			if (Object.keys(paths).length > 0) {
				s.appendRight(
					needsComma ? lastProperty.end : lastComma,
					`${needsComma ? ',' : ''}\n${Object.entries(paths)
						.map(
							([key, value]) =>
								`\t\t${VALID_VARIABLE_NAME_REGEX.test(key) ? key : `'${key}'`}: '${value}'`
						)
						.join(',\n')}`
				);
			}
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
				`\n\tpaths: {\n${Object.entries(paths)
					.map(
						([key, value]) =>
							`\t\t${VALID_VARIABLE_NAME_REGEX.test(key) ? key : `'${key}'`}: '${value}'`
					)
					.join(',\n')}\n\t}`
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
				`${needsComma ? ',' : ''}\n\tpaths: {\n${Object.entries(paths)
					.map(
						([key, value]) =>
							`\t\t${VALID_VARIABLE_NAME_REGEX.test(key) ? key : `'${key}'`}: '${value}'`
					)
					.join(',\n')}\n\t}`
			);
		}
	}

	return ok(s.toString());
}
