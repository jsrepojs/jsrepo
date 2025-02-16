/*
	jsrepo 1.36.0
	Installed from github/ieedan/shadcn-svelte-extras
	2-16-2025
*/

import type { TransitionConfig } from 'svelte/transition';

export type Options = {
	speed: number;
	delay: number;
};

export const typewriter = (node: HTMLElement, { speed = 1, delay = 0 }: Partial<Options>) => {
	const text = node.textContent ?? '';
	const duration = text.length / (speed * 0.01);

	return {
		delay,
		duration,
		tick: (t) => {
			const i = Math.trunc(text.length * t);
			node.textContent = text.slice(0, i);
		}
	} satisfies TransitionConfig;
};
