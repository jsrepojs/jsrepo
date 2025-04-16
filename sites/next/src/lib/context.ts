import { Context } from 'runed';
import type { UseBoolean } from '$lib/hooks/use-boolean.svelte';

export const commandContext = new Context<UseBoolean>('command-menu-context');
