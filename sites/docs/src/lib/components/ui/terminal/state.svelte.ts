/*
	jsrepo 1.36.0
	Installed from github/ieedan/shadcn-svelte-extras
	2-16-2025
*/

import { Context } from 'runed';

export type Timeout = ReturnType<typeof setTimeout> | undefined;

export type TerminalRootProps = {
	delay: number;
	speed: number;
};

export class TerminalSession {
	#animations: AnimationState[] = $state([]);
	#timeout: Timeout;

	constructor(readonly opts: TerminalRootProps) {}

	play() {
		this.#timeout = setTimeout(() => {
			for (const animation of this.#animations) {
				animation.timeout = setTimeout(() => animation.play(this.opts.speed), animation.delay);
			}
		}, this.opts.delay);
	}

	dispose() {
		clearTimeout(this.#timeout);
	}

	registerAnimation(animation: AnimationState) {
		this.#animations.push(animation);
	}
}

export type AnimationStateProps = {
	delay: number;
	play: (speed: number) => void;
};

export class AnimationState {
	delay: number;
	timeout: Timeout;

	constructor(
		readonly rootState: TerminalSession,
		readonly opts: AnimationStateProps
	) {
		this.delay = opts.delay;

		rootState.registerAnimation(this);
	}

	play(speed: number) {
		this.opts.play(speed);
	}

	dispose() {
		clearTimeout(this.timeout);
	}
}

const TerminalRootContext = new Context<TerminalSession>('Terminal.Root');

export const useTerminalRoot = (props: TerminalRootProps) => {
	return TerminalRootContext.set(new TerminalSession(props));
};

export const useAnimation = (props: AnimationStateProps) => {
	return new AnimationState(TerminalRootContext.get(), props);
};
