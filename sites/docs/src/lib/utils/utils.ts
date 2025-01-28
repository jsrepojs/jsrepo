/*
	jsrepo 1.29.1
	Installed from github/ieedan/shadcn-svelte-extras
	1-28-2025
*/

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
