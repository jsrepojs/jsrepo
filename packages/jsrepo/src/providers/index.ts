import { err, type Result } from 'nevereverthrow';
import { type Manifest, ManifestSchema } from '@/api';
import { type AzureOptions, azure } from '@/providers/azure';
import { type BitBucketOptions, bitbucket } from '@/providers/bitbucket';
import { type FsOptions, fs } from '@/providers/fs';
import { type GitHubOptions, github } from '@/providers/github';
import { type GitLabOptions, gitlab } from '@/providers/gitlab';
import { type HttpOptions, http } from '@/providers/http';
import { type JsrepoOptions, jsrepo } from '@/providers/jsrepo';
import type { FetchOptions, Provider } from '@/providers/types';
import { MANIFEST_FILE } from '@/utils/build';
import { type InvalidJSONError, ManifestFetchError, type ZodError } from '@/utils/errors';
import { safeParseFromJSON } from '@/utils/zod';

export const DEFAULT_PROVIDERS = [jsrepo(), github(), gitlab(), bitbucket(), azure(), http()];

export {
	github,
	type GitHubOptions,
	gitlab,
	type GitLabOptions,
	bitbucket,
	type BitBucketOptions,
	azure,
	type AzureOptions,
	http,
	type HttpOptions,
	jsrepo,
	type JsrepoOptions,
	fs,
	type FsOptions,
};
export * from '@/providers/types';

export async function fetchManifest(
	provider: Provider,
	options: FetchOptions
): Promise<Result<Manifest, InvalidJSONError | ZodError | ManifestFetchError>> {
	try {
		const manifestJson = await provider.fetch(MANIFEST_FILE, options);
		return safeParseFromJSON(ManifestSchema, manifestJson);
	} catch (e) {
		return err(new ManifestFetchError(e));
	}
}
