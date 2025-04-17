import * as prettier from 'prettier';
import type { Lang } from '.';
import * as lines from '../blocks/ts/lines';
import { Ok } from '../blocks/ts/result';

/** Language support for `*.(yaml|yml)` files. */
export const yaml: Lang = {
	matches: (fileName) => fileName.endsWith('.yml') || fileName.endsWith('.yaml'),
	resolveDependencies: () =>
		Ok({ dependencies: [], local: [], devDependencies: [], imports: {} }),
	comment: (content: string) => lines.join(lines.get(content), { prefix: () => '# ' }),
	format: async (code, { formatter, prettierOptions }) => {
		if (!formatter) return code;

		if (formatter === 'prettier') {
			return await prettier.format(code, { parser: 'yaml', ...prettierOptions });
		}

		return code;
	},
};
