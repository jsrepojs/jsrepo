import fs from 'node:fs';
import type { Configuration } from '@biomejs/wasm-nodejs';
import path from 'pathe';
import * as prettier from 'prettier';
import type { Formatter } from './config';

export type FormatterConfig = {
	prettierOptions: prettier.Options | null;
	biomeOptions: Configuration | null;
};

export async function loadFormatterConfig({
	formatter,
	cwd,
}: {
	formatter?: Formatter;
	cwd: string;
}): Promise<FormatterConfig> {
	let prettierOptions: prettier.Options | null = null;
	if (formatter === 'prettier') {
		prettierOptions = await prettier.resolveConfig(path.join(cwd, '.prettierrc'));
	}

	let biomeOptions: Configuration | null = null;
	if (formatter === 'biome') {
		const configPath = path.join(cwd, 'biome.json');
		if (fs.existsSync(configPath)) {
			biomeOptions = JSON.parse(fs.readFileSync(configPath).toString());
		}
	}

	return {
		biomeOptions,
		prettierOptions,
	};
}
