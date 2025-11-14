import path from 'pathe';
import type { AbsolutePath, Branded, ItemRelativePath } from './types';

/**
 * Join all arguments together and normalize the resulting path.
 *
 * @param p
 * @param paths
 * @returns
 */
export function joinAbsolute(p: AbsolutePath, ...paths: string[]): AbsolutePath {
	return path.join(p, ...paths) as AbsolutePath;
}

export type NormalizedAbsolutePath = Branded<AbsolutePath, 'normalizedAbsolutePath'>;

export function normalizeAbsolute(p: AbsolutePath): NormalizedAbsolutePath {
	return path.normalize(p) as NormalizedAbsolutePath;
}

export function joinRelative(p: ItemRelativePath, ...paths: string[]): ItemRelativePath {
	return path.join(p, ...paths) as ItemRelativePath;
}

/**
 * Return the directory name of a path. Similar to the Unix dirname command.
 *
 * @param path the path to evaluate.
 * @throws {TypeError} if path is not a string.
 * @returns
 */
export function dirname(p: AbsolutePath): AbsolutePath {
	return path.dirname(p) as AbsolutePath;
}

export type RelativeToCwdPath = Branded<ItemRelativePath, 'relativeToCwdPath'>;

export function relativeToCwd(cwd: AbsolutePath, p: AbsolutePath): RelativeToCwdPath {
	return path.relative(cwd, p) as RelativeToCwdPath;
}
