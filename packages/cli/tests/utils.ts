import fs from 'node:fs';
import { expect } from 'vitest';

export const assertFilesExist = (dir: string, ...files: string[]) => {
	const fileSet = new Set(files);

	const filesInDir = fs.readdirSync(dir);

	for (const file of filesInDir) {
		fileSet.delete(file);
	}

	expect(Array.from(fileSet)).toStrictEqual([]);
};
