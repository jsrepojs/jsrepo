import { Biome, Distribution } from '@biomejs/js-api';
import * as prettier from 'prettier';
import type { Lang } from '.';
import * as lines from '../blocks/ts/lines';
import { Ok } from '../blocks/ts/result';

const format: Lang['format'] = async (
	code,
	{ formatter, prettierOptions, biomeOptions, filePath }
) => {
	if (!formatter) return code;

	if (formatter === 'prettier') {
		return await prettier.format(code, { filepath: filePath, ...prettierOptions });
	}

	const biome = await Biome.create({
		distribution: Distribution.NODE,
	});

	if (biomeOptions) {
		biome.applyConfiguration({
			...biomeOptions,
			json: { parser: { allowComments: true } },
		});
	}

	return biome.formatContent(code, { filePath }).content;
};

/** Language support for `*.(json)` files. */
export const json: Lang = {
	matches: (fileName) => fileName.endsWith('.json'),
	resolveDependencies: () =>
		Ok({ dependencies: [], local: [], devDependencies: [], imports: {} }),
	// json doesn't support comments
	comment: (_content: string) => '',
	format,
};

/** Language support for `*.(jsonc)` files. */
export const jsonc: Lang = {
	matches: (fileName) => fileName.endsWith('.jsonc'),
	resolveDependencies: () =>
		Ok({ dependencies: [], local: [], devDependencies: [], imports: {} }),
	comment: (content) => `/*\n${lines.join(lines.get(content), { prefix: () => '\t' })}\n*/`,
	format,
};
