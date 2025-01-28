/*
	jsrepo 1.29.1
	Installed from github/ieedan/shadcn-svelte-extras
	1-28-2025
*/

import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

/** A context provider to safely share state across your app
 *
 * ## Usage
 * ```
 * const myContext = context('my-context-key');
 * ```
 */
export type Context<T> = {
	/** Call this to initialize context at the parent component root.
	 *
	 * ## Usage
	 * ```svelte
	 * <script lang="ts">
	 * 		const ctx = myContext.init('Hello');
	 * </script>
	 * ```
	 */
	init: (value: T) => Writable<T>;
	/** Call this to retrieve the context at the child component root.
	 *
	 * ## Usage
	 * ```svelte
	 * <script lang="ts">
	 * 		const ctx = myContext.get();
	 * </script>
	 * ```
	 */
	get: () => Writable<T>;
};

/** Creates a new Context instance.
 *
 * ## Usage
 * ```
 * const myContext = context('my-context-key');
 * ```
 */
export const context = <T>(key: string): Context<T> => {
	return {
		init: (value) => setContext(key, writable(value)),
		get: () => getContext(key)
	};
};
