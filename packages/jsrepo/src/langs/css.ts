import * as c from 'css-dependency';
import { installDependencies, resolveImports, transformImports } from '@/langs/js';
import type { Language } from '@/langs/types';

export type CssOptions = {
	/**
	 * Whether to allow tailwind directives to be parsed as imports.
	 * @default true
	 */
	allowTailwindDirectives: boolean;
};

/**
 * Detect dependencies in `.css`, `.scss`, and `.sass` files.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import { css } from "jsrepo/langs";
 *
 * export default defineConfig({
 *  // ...
 *  languages: [css()],
 * });
 * ```
 *
 * @param options - The options for the language plugin.
 */
export function css({ allowTailwindDirectives = true }: Partial<CssOptions> = {}): Language {
	return {
		name: 'css',
		canResolveDependencies: (fileName) =>
			fileName.endsWith('.css') || fileName.endsWith('.scss') || fileName.endsWith('.sass'),
		resolveDependencies: async (code, opts) => {
			const imports = c.parse(code, { allowTailwindDirectives });
			if (imports.isErr())
				return { localDependencies: [], dependencies: [], devDependencies: [] };

			return resolveImports(
				imports.unwrap().map((imp) => imp.module),
				opts
			);
		},
		transformImports: async (imports, opts) => transformImports(imports, opts),
		canInstallDependencies: (ecosystem) => ecosystem === 'js',
		installDependencies: async (deps, opts) => installDependencies(deps, opts),
	};
}
