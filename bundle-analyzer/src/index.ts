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

type TreeNode = {
	name: string;
	size: number;
	children: Map<string, TreeNode>;
	isFile: boolean;
};

function buildTree(files: File[]): TreeNode {
	const root: TreeNode = {
		name: '',
		size: 0,
		children: new Map(),
		isFile: false,
	};

	for (const file of files) {
		const parts = file.path.split(path.sep).filter((p) => p.length > 0);
		let current = root;
		current.size += file.stats.size;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i]!;
			const isLast = i === parts.length - 1;

			if (!current.children.has(part)) {
				current.children.set(part, {
					name: part,
					size: 0,
					children: new Map(),
					isFile: isLast,
				});
			}

			const node = current.children.get(part);
			if (!node) continue;

			if (isLast) {
				node.size = file.stats.size;
			} else {
				node.size += file.stats.size;
			}
			current = node;
		}
	}

	return root;
}

function displayTree(node: TreeNode, totalSize: number, prefix = '', isLast = true): void {
	const percentage = ((node.size / totalSize) * 100).toFixed(1);
	const connector = isLast ? '└──' : '├──';
	const name = node.isFile ? pc.cyan(node.name) : pc.bold(node.name);
	const sizeStr = displaySize(node.size);
	const percentageStr = pc.gray(`(${percentage}%)`);

	console.log(`${prefix}${connector} ${name} ${sizeStr} ${percentageStr}`);

	const children = Array.from(node.children.values()).sort((a, b) => {
		// Sort directories before files, then by size descending
		if (a.isFile !== b.isFile) {
			return a.isFile ? 1 : -1;
		}
		return b.size - a.size;
	});

	const childPrefix = prefix + (isLast ? '   ' : '│  ');
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (!child) continue;
		const isLastChild = i === children.length - 1;
		displayTree(child, totalSize, childPrefix, isLastChild);
	}
}

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

	const root = buildTree(files);
	const children = Array.from(root.children.values()).sort((a, b) => {
		// Sort directories before files, then by size descending
		if (a.isFile !== b.isFile) {
			return a.isFile ? 1 : -1;
		}
		return b.size - a.size;
	});

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (!child) continue;
		const isLast = i === children.length - 1;
		displayTree(child, totalSize, '', isLast);
	}
}

const args = process.argv.slice(2);

const cwd = args[0];
if (!cwd) {
	console.error('No path provided');
	process.exit(1);
}

analyze({ cwd });
