import nodeFetch from 'node-fetch';
import { Err, Ok, type Result } from './blocks/ts/result';
import type { Package } from './parse-package-name';
import * as persisted from './persisted';

const LATEST_VERSION_KEY = 'latest-version';
const EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour

type LatestVersion = {
	expiration: number;
	version: string;
};

/** Checks for the latest version from the github repository. Will cache results for up to 1 hour. */
export async function getLatestVersion({
	noCache = false,
}: { noCache?: boolean } = {}): Promise<Result<string, string>> {
	try {
		// handle caching
		const storage = persisted.get();

		let version: string;

		if (!noCache) {
			const latestVersion = storage.get(LATEST_VERSION_KEY) as LatestVersion | null;

			if (latestVersion) {
				if (latestVersion.expiration > Date.now()) {
					version = latestVersion.version;

					return Ok(version);
				}

				storage.delete(LATEST_VERSION_KEY);
			}
		}

		// we abort the request after a second
		// because it really just isn't worth it if it's going to take that long
		const controller = new AbortController();

		const timeout = setTimeout(() => {
			controller.abort();
		}, 1000);

		const response = await nodeFetch(
			'https://raw.githubusercontent.com/jsrepojs/jsrepo/refs/heads/main/packages/cli/package.json',
			{
				signal: controller.signal,
			}
		);

		clearTimeout(timeout);

		if (!response.ok) {
			return Err('Error getting version');
		}

		const { version: ver } = (await response.json()) as Package;

		version = ver;

		storage.set(LATEST_VERSION_KEY, {
			expiration: Date.now() + EXPIRATION_TIME,
			version,
		} satisfies LatestVersion);

		return Ok(version);
	} catch (err) {
		return Err(`Error getting version: ${err}`);
	}
}
