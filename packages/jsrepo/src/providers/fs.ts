import fs from 'node:fs';
import path from 'pathe';
import type { CreateOptions, Provider, ProviderFactory } from '@/providers/types';
import { ProviderFetchError } from '@/utils/errors';

export type FsOptions = {
	/** In case you want all your registry paths to be relative to a base directory. */
	baseDir?: string;
};

/**
 * The built in File System provider. Allows you to run registries locally using the file system.
 * @param options
 * @returns
 *
 * @urlFormat
 * ```
 * 'fs://<path>'
 * 'fs://../relative/path' // relative paths
 * 'fs://users/john' // absolute path
 * ```
 *
 * @example
 * ```ts
 * import { defineConfig } from "jsrepo/config";
 * import { fs } from "jsrepo/providers";
 *
 * export default defineConfig({
 * 	providers: [fs()],
 * });
 * ```
 */
function _fs(options: FsOptions = {}): ProviderFactory {
	return {
		name: 'Fs',
		matches: (url: string) => url.startsWith('fs://'),
		create: (url: string, createOpts: CreateOptions) => Fs.create(url, options, createOpts),
	};
}

export { _fs as fs };

type FsState = {
	path: string;
};

class Fs implements Provider {
	constructor(
		readonly state: FsState,
		readonly opts: FsOptions
	) {}

	async fetch(resourcePath: string): Promise<string> {
		const filePath = path.join(this.state.path, resourcePath);

		try {
			return fs.readFileSync(filePath, 'utf-8');
		} catch (error) {
			const resourcePathStr = path.isAbsolute(filePath)
				? filePath
				: path.join(process.cwd(), filePath);
			throw new ProviderFetchError(
				`${error instanceof Error ? error.message : String(error)}`,
				resourcePathStr
			);
		}
	}

	static async create(
		url: string,
		opts: FsOptions,
		createOpts: CreateOptions
	): Promise<Provider> {
		const actualUrl = url.slice(5);
		let p: string;
		if (opts.baseDir) {
			if (opts.baseDir.startsWith('.')) {
				p = path.join(createOpts.cwd, opts.baseDir, actualUrl);
			} else {
				p = path.join(opts.baseDir, actualUrl);
			}
		} else {
			if (actualUrl.startsWith('.')) {
				p = path.join(createOpts.cwd, actualUrl);
			} else {
				p = actualUrl;
			}
		}

		return new Fs({ path: p }, opts);
	}
}
