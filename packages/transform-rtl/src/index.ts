import type { Transform } from 'jsrepo';
import MagicString from 'magic-string';
import { type ParseResult, parse, Visitor } from 'oxc-parser';
import { applyRtlMapping } from './rtl-mappings.js';

/** Functions that accept (base, config) where config has variants (e.g. cva, tv). */
const VARIANT_STYLE_FUNCTIONS = new Set(['cva', 'tv']);

const DEFAULT_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js', '.svelte'] as const;
const DEFAULT_CLASS_ATTRIBUTES = ['class', 'className'] as const;
const DEFAULT_TAILWIND_FUNCTIONS = ['cva', 'tv', 'cn', 'clsx'] as const;

export type Options = {
	/**
	 * File extensions to transform (e.g. only run on these files).
	 * @default ['.tsx', '.jsx', '.ts', '.js', '.svelte']
	 */
	extensions?: string[];
	/**
	 * JSX/HTML attribute names that hold class names (e.g. `class` for Svelte/HTML, `className` for React).
	 * @default ['class', 'className']
	 */
	classAttributes?: string[];
	/**
	 * Names of Tailwind/class-name helper functions to transform.
	 * - `cva` and `tv`: first argument (base) and second argument (variants object) are scanned.
	 * - Others (e.g. `cn`, `clsx`): all arguments are scanned for class strings.
	 * @default ['cva', 'tv', 'cn', 'clsx']
	 */
	tailwindFunctions?: string[];
};

/**
 * A transform plugin for jsrepo to make Tailwind classes RTL-safe.
 * Remaps physical (left/right) classes to logical (start/end) and adds rtl: variants where needed.
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import rtl from "@jsrepo/transform-rtl";
 *
 * export default defineConfig({
 *   transforms: [rtl()],
 * });
 * ```
 *
 * @example
 * ```ts
 * // Custom tailwind functions (e.g. add twMerge)
 * rtl({ tailwindFunctions: ['cva', 'tv', 'cn', 'clsx', 'twMerge'] })
 * ```
 */
export default function (options: Options = {}): Transform {
	const extensions = new Set(options.extensions ?? [...DEFAULT_EXTENSIONS]);
	const classAttributes = new Set(options.classAttributes ?? [...DEFAULT_CLASS_ATTRIBUTES]);
	const tailwindFunctions = new Set(options.tailwindFunctions ?? [...DEFAULT_TAILWIND_FUNCTIONS]);
	return {
		transform: async ({ code, fileName }) => {
			const result = await transformCode(fileName, code, {
				extensions,
				classAttributes,
				tailwindFunctions,
			});
			return result != null ? { code: result } : {};
		},
	};
}

export { applyRtlMapping } from './rtl-mappings.js';

type Replacement = { start: number; end: number; newText: string };

function getStringLiteralValue(node: { value?: string; raw?: string }): string | undefined {
	if (typeof node.value === 'string') return node.value;
	if (typeof node.raw === 'string') {
		return node.raw.slice(1, -1).replace(/\\(.)/g, '$1');
	}
	return undefined;
}

function getNodeRange(node: { start: number; end: number }): { start: number; end: number } {
	return { start: node.start, end: node.end };
}

/**
 * Collects class string literal replacements from a node that may contain class names.
 * Returns array of { start, end, newText } for MagicString updates.
 */
function collectClassReplacements(
	node: unknown,
	code: string,
	replacements: Replacement[],
	tailwindFunctions: Set<string>
): void {
	if (!node || typeof node !== 'object') return;
	const n = node as Record<string, unknown>;

	if (n.type === 'StringLiteral' || n.type === 'Literal') {
		const value = getStringLiteralValue(n as { value?: string; raw?: string });
		if (value != null && 'start' in n && 'end' in n) {
			const mapped = applyRtlMapping(value);
			if (mapped !== value) {
				const range = getNodeRange(n as { start: number; end: number });
				replacements.push({ ...range, newText: `"${mapped.replace(/"/g, '\\"')}"` });
			}
		}
		return;
	}

	if (n.type === 'CallExpression') {
		const callee = n.callee as Record<string, unknown> | undefined;
		const args = n.arguments as unknown[] | undefined;
		const name = callee?.type === 'Identifier' ? (callee as { name?: string }).name : undefined;
		if (name != null && tailwindFunctions.has(name)) {
			if (VARIANT_STYLE_FUNCTIONS.has(name)) {
				if (args?.[0])
					collectClassReplacements(args[0], code, replacements, tailwindFunctions);
				if (args?.[1])
					collectClassReplacements(args[1], code, replacements, tailwindFunctions);
			} else {
				for (const arg of args ?? []) {
					collectClassReplacements(arg, code, replacements, tailwindFunctions);
				}
			}
			return;
		}
	}

	if (n.type === 'ConditionalExpression') {
		collectClassReplacements(n.consequent, code, replacements, tailwindFunctions);
		collectClassReplacements(n.alternate, code, replacements, tailwindFunctions);
		return;
	}

	if (n.type === 'BinaryExpression') {
		collectClassReplacements(n.left, code, replacements, tailwindFunctions);
		collectClassReplacements(n.right, code, replacements, tailwindFunctions);
		return;
	}

	if (n.type === 'ObjectExpression') {
		for (const prop of (n.properties ?? []) as unknown[]) {
			const p = prop as Record<string, unknown>;
			collectClassReplacements(p.value, code, replacements, tailwindFunctions);
		}
		return;
	}
}

async function transformCode(
	fileName: string,
	code: string,
	options: {
		extensions: Set<string>;
		classAttributes: Set<string>;
		tailwindFunctions: Set<string>;
	}
): Promise<string | undefined> {
	const hasSupportedExtension = [...options.extensions].some((ext) => fileName.endsWith(ext));
	if (!hasSupportedExtension) {
		return undefined;
	}

	let parsed: ParseResult;
	try {
		parsed = await parse(fileName, code);
	} catch {
		return undefined;
	}

	const { classAttributes, tailwindFunctions } = options;
	const replacements: Replacement[] = [];
	const visitor = new Visitor({
		JSXAttribute(attr) {
			const nameNode = attr.name as unknown as Record<string, unknown> | undefined;
			if (nameNode?.type !== 'JSXIdentifier') return;
			const name = (nameNode as { name?: string }).name;
			if (name == null || !classAttributes.has(name)) return;

			const value = attr.value;
			if (!value) return;

			const valueNode = value as unknown as Record<string, unknown>;
			if (valueNode.type === 'StringLiteral' || valueNode.type === 'Literal') {
				collectClassReplacements(value, code, replacements, tailwindFunctions);
				return;
			}
			if (valueNode.type === 'JSXExpressionContainer') {
				const expr = (valueNode as { expression?: unknown }).expression as
					| unknown
					| undefined;
				if (expr) collectClassReplacements(expr, code, replacements, tailwindFunctions);
			}
		},
		CallExpression(expr) {
			const callee = expr.callee as unknown as Record<string, unknown> | undefined;
			if (callee?.type !== 'Identifier') return;
			const name = (callee as { name?: string }).name;
			const args = expr.arguments as unknown[] | undefined;
			if (name != null && tailwindFunctions.has(name)) {
				if (VARIANT_STYLE_FUNCTIONS.has(name)) {
					if (args?.[0])
						collectClassReplacements(args[0], code, replacements, tailwindFunctions);
					if (args?.[1])
						collectClassReplacements(args[1], code, replacements, tailwindFunctions);
				} else {
					for (const arg of args ?? []) {
						collectClassReplacements(arg, code, replacements, tailwindFunctions);
					}
				}
			} else if (name === 'mergeProps' && args?.[0]) {
				const firstArg = args[0] as Record<string, unknown>;
				if (firstArg.type === 'ObjectExpression') {
					for (const prop of (firstArg.properties ?? []) as unknown[]) {
						const p = prop as Record<string, unknown>;
						const keyName = (p.key as { name?: string })?.name;
						if (keyName != null && classAttributes.has(keyName) && p.value) {
							collectClassReplacements(
								p.value,
								code,
								replacements,
								tailwindFunctions
							);
						}
					}
				}
			}
		},
	});

	visitor.visit(parsed.program);

	if (replacements.length === 0) return undefined;

	const s = new MagicString(code);
	// Apply from end to start so indices remain valid
	replacements.sort((a, b) => b.start - a.start);
	for (const r of replacements) {
		s.update(r.start, r.end, r.newText);
	}
	return s.toString();
}
