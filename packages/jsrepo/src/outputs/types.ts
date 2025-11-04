import { z } from 'zod';
import type { BuildResult } from '@/utils/build';

export interface Output {
	output(buildResult: BuildResult, opts: { cwd: string }): Promise<void>;
	clean(opts: { cwd: string }): Promise<void>;
}

export const RegistryPluginSchema = z.object({
	package: z.string(),
	version: z.string().optional(),
	optional: z.boolean().optional(),
});

export const RegistryPluginsSchema = z.object({
	languages: z.array(RegistryPluginSchema).optional(),
	providers: z.array(RegistryPluginSchema).optional(),
	transforms: z.array(RegistryPluginSchema).optional(),
});
