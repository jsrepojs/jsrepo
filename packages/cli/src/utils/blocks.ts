import fs from 'node:fs';
import color from 'chalk';
import { program } from 'commander';
import path from 'pathe';
import { Err, Ok, type Result } from './blocks/types/result';
import { mapToArray } from './blocks/utils/map-to-array';
import type { Block } from './build';
import { type ProjectConfig, resolvePaths } from './config';
import * as providers from './providers';

export type RemoteBlock = Block & { sourceRepo: providers.Info };

export type InstallingBlock = {
	name: string;
	subDependency: boolean;
	block: RemoteBlock;
};

const resolveTree = async (
	blockSpecifiers: string[],
	blocksMap: Map<string, RemoteBlock>,
	repoPaths: providers.ResolvedRepo[],
	installed: Map<string, InstallingBlock> = new Map()
): Promise<Result<InstallingBlock[], string>> => {
	const blocks = new Map<string, InstallingBlock>();

	for (const blockSpecifier of blockSpecifiers) {
		let block: RemoteBlock | undefined = undefined;

		const provider = providers.providers.find((p) => blockSpecifier.startsWith(p.name()));

		// if the block starts with github (or another provider) we know it has been resolved
		if (!provider) {
			if (repoPaths.length === 0) {
				return Err(
					color.red(
						`If your config doesn't repos then you must provide the repo in the block specifier ex: \`${color.bold(
							`github/<owner>/<name>/${blockSpecifier}`
						)}\`!`
					)
				);
			}

			// check every repo for the block and return the first block found
			for (const { info: providerInfo } of repoPaths) {
				const [repoIdent, specifier] = providerInfo.provider.parseBlockSpecifier(
					`${providerInfo.url}/${blockSpecifier}`
				);

				const tempBlock = blocksMap.get(`${repoIdent}/${specifier}`);

				if (tempBlock === undefined) continue;

				block = tempBlock;

				break;
			}
		} else {
			// get shortened name
			const [repoIdent, specifier] = provider.parseBlockSpecifier(blockSpecifier);

			// just beautifies name a bit
			block = blocksMap.get(`${repoIdent}/${specifier}`);
		}

		if (!block) {
			return Err(`Invalid block! ${color.bold(blockSpecifier)} does not exist!`);
		}

		const specifier = `${block.category}/${block.name}`;

		blocks.set(specifier, { name: block.name, subDependency: false, block });

		if (block.localDependencies && block.localDependencies.length > 0) {
			const subDeps = await resolveTree(
				block.localDependencies.filter((dep) => !blocks.has(dep) && !installed.has(dep)),
				blocksMap,
				repoPaths,
				blocks
			);

			if (subDeps.isErr()) return Err(subDeps.unwrapErr());

			for (const dep of subDeps.unwrap()) {
				blocks.set(`${dep.block.category}/${dep.block.name}`, dep);
			}
		}
	}

	return Ok(mapToArray(blocks, (_, val) => val));
};

type InstalledBlock = {
	specifier: `${string}/${string}`;
	path: string;
	block: Block;
};

/** Finds installed blocks and returns them as `<category>/<name>`
 *
 * @param blocks
 * @param config
 * @returns
 */
const getInstalled = (
	blocks: Map<string, Block>,
	config: ProjectConfig,
	cwd: string
): InstalledBlock[] => {
	const installedBlocks: InstalledBlock[] = [];

	const resolvedPathsResult = resolvePaths(config.paths, cwd);

	if (resolvedPathsResult.isErr()) {
		program.error(color.red(resolvedPathsResult.unwrapErr()));
	}

	const resolvedPaths = resolvedPathsResult.unwrap();

	for (const [_, block] of blocks) {
		let baseDir: string;

		if (resolvedPaths[block.category] !== undefined) {
			baseDir = path.join(cwd, resolvedPaths[block.category]);
		} else {
			baseDir = path.join(cwd, resolvedPaths['*'], block.category);
		}

		let blockPath = path.join(baseDir, block.files[0]);
		if (block.subdirectory) {
			blockPath = path.join(baseDir, block.name);
		}

		if (fs.existsSync(blockPath))
			installedBlocks.push({
				specifier: `${block.category}/${block.name}`,
				path: blockPath,
				block,
			});
	}

	return installedBlocks;
};

const fullyQualifiedName = (url: string, category: string, name: string) => {
	return new URL(`${category}/${name}`, url).toString();
};

export { resolveTree, getInstalled, fullyQualifiedName };
