import type { Agent } from 'package-manager-detector';

export type Flags = {
	'no-workspace'?: string;
	'install-as-dev-dependency': string;
};

export const bun: Flags = {
	'no-workspace': '--no-workspace',
	'install-as-dev-dependency': '-D',
};

export const deno: Flags = {
	'install-as-dev-dependency': '-D',
};

export const npm: Flags = {
	'no-workspace': '--workspaces=false',
	'install-as-dev-dependency': '-D',
};

export const pnpm: Flags = {
	'no-workspace': '--ignore-workspace',
	'install-as-dev-dependency': '-D',
};

export const yarn: Flags = {
	'no-workspace': '--focus',
	'install-as-dev-dependency': '-D',
};

export const flags: Record<Agent, Flags> = {
	bun,
	npm,
	pnpm,
	deno,
	yarn,
	'yarn@berry': yarn,
	'pnpm@6': pnpm,
};
