import { z } from 'zod';

export const commonOptions = {
	cwd: z
		.string()
		.describe(
			'The path of the current working directory. Used to find the jsrepo.config file.'
		),
};
