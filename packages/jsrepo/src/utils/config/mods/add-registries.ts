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
import { ConfigObjectNotFoundError, InvalidKeyTypeError } from '@/utils/errors';

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

export async function addRegistriesToConfig(
	registries: string[],
	{ config }: { config: { path: string; code: string } }
): Promise<Result<string, InvalidKeyTypeError | ConfigObjectNotFoundError>> {
	if (registries.length === 0) return ok(config.code);

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
			if (prop.key.type === 'Identifier' && prop.key.name !== 'registries') {
				state.withinIgnoredProperty = true;
				return;
			}
			// locate the config key
			if (
				prop.key.type === 'Identifier' &&
				(prop.kind === 'init' || prop.kind === 'get') &&
				prop.key.name === 'registries'
			) {
				if (prop.value.type !== 'ArrayExpression')
					return err(new InvalidKeyTypeError({ key: 'registries', type: 'array' }));
				state.configKeyPropertyDeclaration = prop;
			}
		},
		'Property:exit'(prop) {
			if (!state.withinDefineConfig) return;
			if (prop.key.type === 'Identifier' && prop.key.name !== 'registries') {
				state.withinIgnoredProperty = false;
				return;
			}
		},
	});

	visitor.visit(parsed.program);

	// add call expressions to the config key
	if (state.configKeyPropertyDeclaration !== null) {
		// handle object with the config key
		if (state.configKeyPropertyDeclaration.value.type !== 'ArrayExpression') {
			return err(new InvalidKeyTypeError({ key: 'registries', type: 'array' }));
		}

		for (const value of state.configKeyPropertyDeclaration.value.elements) {
			if (!value || value.type !== 'Literal') continue;
			if (typeof value.value !== 'string') continue;

			registries = registries.filter((r) => r !== value.value);
		}

		if (registries.length === 0) return ok(config.code);

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
			s.appendRight(
				state.configKeyPropertyDeclaration.value.start + 1,
				`${registries.map((registry) => `'${registry}'`).join(', ')}`
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

			s.appendRight(
				needsComma ? lastElement.end : lastComma,
				`${needsComma ? ',' : ''} ${registries.map((registry) => `'${registry}'`).join(', ')}`
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
				`\n\tregistries: [${registries.map((registry) => `'${registry}'`).join(', ')}]`
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
				`${needsComma ? ',' : ''}\n\tregistries: [${registries.map((registry) => `'${registry}'`).join(', ')}]`
			);
		}
	}

	return ok(s.toString());
}
