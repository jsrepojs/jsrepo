/*
	jsrepo 1.22.1
	Installed from github/ieedan/shadcn-svelte-extras
	12-23-2024
*/

// add any additional languages here
export const LANGUAGES = [
	'typescript',
	'javascript',
	'svelte',
	'diff',
	'json',
	'yml',
	'yaml',
	'vue',
	'tsx',
	'jsx',
	'tsx',
	'bash',
	'ts',
	'js'
] as const;

/** The languages configured for the highlighter */
export type SupportedLanguage = (typeof LANGUAGES)[number];
