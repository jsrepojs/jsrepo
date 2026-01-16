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
