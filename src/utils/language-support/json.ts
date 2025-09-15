import { Biome, Distribution } from '@biomejs/js-api';
import * as prettier from 'prettier';
import * as lines from '../blocks/ts/lines';
import { Ok } from '../blocks/ts/result';
import type { Lang } from '.';

const format: Lang['format'] = async (
	code,
	{ formatter, prettierOptions, biomeOptions, filePath, cwd }
) => {
	if (!formatter) return code;

	if (formatter === 'prettier') {
		return await prettier.format(code, { filepath: filePath, ...prettierOptions });
	}

	const biome = await Biome.create({
		distribution: Distribution.NODE,
	});

	const { projectKey } = biome.openProject(cwd);

	if (biomeOptions) {
		biome.applyConfiguration(projectKey, {
			...biomeOptions,
			json: { parser: { allowComments: true } },
		});
	}

	return biome.formatContent(projectKey, code, { filePath }).content;
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
