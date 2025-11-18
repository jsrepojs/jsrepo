import path from 'pathe';
import type { AbsolutePath } from './types';

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
