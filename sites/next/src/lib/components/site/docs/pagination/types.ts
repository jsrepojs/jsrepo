import type { Snippet } from 'svelte';
import type { HTMLAnchorAttributes } from 'svelte/elements';

export interface Props extends HTMLAnchorAttributes {
	children: Snippet<[]>;
}
