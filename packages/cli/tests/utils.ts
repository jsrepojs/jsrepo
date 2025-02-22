import fs from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';

export const assertFilesExist = (dir: string, ...files: string[]) => {
	for (const f of files) {
		expect(fs.existsSync(path.join(dir, f)), `Expected ${path.join(dir, f)} to exist.`).toBe(
			true
		);
	}
};
