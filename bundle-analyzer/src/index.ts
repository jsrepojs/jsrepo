import fs, { type Stats } from 'node:fs';
import path from 'node:path';
import Arborist from '@npmcli/arborist';
import packlist from 'npm-packlist';
import pc from 'picocolors';
import { displaySize } from './utils';

export type AnalyzeOptions = {
	cwd: string;
};

type File = {
	path: string;
	stats: Stats;
};

export async function analyze(options: AnalyzeOptions) {
	const arborist = new Arborist({ path: options.cwd });
	const tree = await arborist.loadActual();
	const list = await packlist(tree);

	const files: File[] = [];
	for (const file of list) {
		files.push({
			path: file,
			stats: fs.statSync(path.join(options.cwd, file)),
		});
	}

	const totalSize = files.reduce((acc, file) => acc + file.stats.size, 0);

	console.log(`Total unpacked size: ${displaySize(totalSize)}`);

	for (const file of files) {
		console.log(`  ${pc.cyan(file.path)}: ${displaySize(file.stats.size)}`);
	}
}

const args = process.argv.slice(2);

const cwd = args[0];
if (!cwd) {
	console.error('No path provided');
	process.exit(1);
}

analyze({ cwd });
