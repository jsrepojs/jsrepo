import fg, { type Pattern } from 'fast-glob';
import { err, ok, type Result } from 'nevereverthrow';
import { GlobError } from '@/utils/errors';

/**
 * A safe wrapper around the fast-glob function.
 *
 * @param source
 * @param options
 * @returns
 */
export async function glob(
	source: Pattern,
	options: fg.Options & { registryName: string }
): Promise<Result<string[], GlobError>> {
	try {
		return ok(await fg(source, options));
	} catch (e) {
		return err(new GlobError(e, source, options.registryName));
	}
}

/**
 * Gets the base directory for a glob pattern using fast-glob's generateTasks.
 * This is more reliable than manually parsing the pattern.
 *
 * @param pattern The glob pattern
 * @param options Options passed to fast-glob
 * @returns The base directory path (relative to cwd if cwd is provided)
 */
export function getGlobBaseDirectory(pattern: Pattern, options?: fg.Options): string {
	try {
		const tasks = fg.generateTasks(pattern, options);
		// generateTasks returns an array of tasks, each with a base property
		// For a single pattern, we'll get one task with the base directory
		if (tasks.length > 0 && tasks[0]) {
			return tasks[0].base;
		}
		// Fallback to current directory if no tasks
		return '.';
	} catch {
		// If generateTasks fails, fallback to current directory
		return '.';
	}
}
