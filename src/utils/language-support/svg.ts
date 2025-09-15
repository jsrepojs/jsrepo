import * as lines from '../blocks/ts/lines';
import { Ok } from '../blocks/ts/result';
import type { Lang } from '.';

/** Language support for `*.svg` files. */
export const svg: Lang = {
	matches: (fileName) => fileName.endsWith('.svg'),
	resolveDependencies: () =>
		Ok({ dependencies: [], local: [], devDependencies: [], imports: {} }),
	comment: (content) => `<!--\n${lines.join(lines.get(content), { prefix: () => '\t' })}\n-->`,
	format: async (code) => code,
};
