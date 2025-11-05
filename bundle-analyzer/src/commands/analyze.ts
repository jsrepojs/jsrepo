import fs, { type Stats } from 'node:fs';
import path from 'node:path';
import Arborist from '@npmcli/arborist';
import { Command } from 'commander';
import packlist from 'npm-packlist';
import pc from 'picocolors';
import { z } from 'zod';
import { displaySize, MEGABYTE } from '../utils/utils';

const analyzeOptionsSchema = z.object({
	failIfExceedsBytes: z.number().optional(),
	json: z.boolean().optional(),
});

export type AnalyzeOptions = z.infer<typeof analyzeOptionsSchema>;

export const analyze = new Command('analyze')
	.description('Analyze bundle size of a package')
	.argument('<cwd>', 'The directory to analyze')
	.option(
		'--fail-if-exceeds-bytes <bytes>',
		'Exit with code 1 if bundle size exceeds the specified bytes',
		(val) => Number.parseInt(val, 10),
		MEGABYTE
	)
	.option('--json', 'Output results as JSON')
	.action(async (cwd: string, options: { failIfExceedsBytes?: number; json?: boolean }) => {
		const analyzeOptions = analyzeOptionsSchema.parse({
			failIfExceedsBytes: options.failIfExceedsBytes,
			json: options.json,
		});

		const totalSize = await runAnalyze({
			cwd,
			failIfExceedsBytes: analyzeOptions.failIfExceedsBytes,
			json: analyzeOptions.json,
		});

		if (options.failIfExceedsBytes !== undefined && totalSize > options.failIfExceedsBytes) {
			if (options.json) {
				console.error(JSON.stringify({ error: 'Bundle size exceeds limit', size: totalSize }));
			} else {
				console.error(
					pc.red(`❌ Bundle size exceeds ${displaySize(options.failIfExceedsBytes)}`)
				);
			}
			process.exit(1);
		}
	});

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

async function runAnalyze(options: { cwd: string; failIfExceedsBytes?: number; json?: boolean }): Promise<number> {
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

	if (options.json) {
		console.log(JSON.stringify({ size: totalSize }));
	} else {
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

	return totalSize;
}
