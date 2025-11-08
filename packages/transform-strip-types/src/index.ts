import type { Transform } from 'jsrepo';

export type Options = {

};

export const SUPPORTED_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'svelte'];

/**
 * A transform plugin for jsrepo to strip types from TypeScript code.
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo";
 * import stripTypes from "@jsrepo/transform-strip-types";
 *
 * export default defineConfig({
 *  // ...
 *  transforms: [stripTypes()],
 * });
 * ```
 *
 * @param options - The options for the transform plugin.
 */
export default function (options: Options = {}): Transform {
	return {
		transform: async (code, opts) => {

		},
	};
}