import color from 'chalk';
import fetch from 'node-fetch';
import { Octokit } from 'octokit';
import * as v from 'valibot';
import type { RemoteBlock } from './blocks';
import { Err, Ok, type Result } from './blocks/types/result';
import { type Category, categorySchema } from './build';
import { OUTPUT_FILE } from './context';
import * as persisted from './persisted';

export type Info = {
	refs: 'tags' | 'heads';
	url: string;
	name: string;
	owner: string;
	/** Valid only for azure provider */
	projectName?: string;
	repoName: string;
	ref: string;
	provider: Provider;
};

export type FetchOptions = {
	verbose: (str: string) => void;
};

export interface Provider {
	/** Get the name of the provider
	 *
	 * @returns the name of the provider
	 */
	name: () => string;
	/** Get the name of the default branch
	 *
	 * @returns
	 */
	defaultBranch: () => string;
	/** Returns a URL to the raw path of the resource provided in the resourcePath
	 *
	 * @param repoPath
	 * @param resourcePath
	 * @returns
	 */
	resolveRaw: (repoPath: string | Info, resourcePath: string) => Promise<URL>;
	/** Returns the content of the requested resource
	 *
	 * @param repoPath
	 * @param resourcePath
	 * @returns
	 */
	fetchRaw: (
		repoPath: string | Info,
		resourcePath: string,
		opts?: Partial<FetchOptions>
	) => Promise<Result<string, string>>;
	/** Returns the manifest for the provided repoPath
	 *
	 * @param repoPath
	 * @param resourcePath
	 * @returns
	 */
	fetchManifest: (repoPath: string | Info) => Promise<Result<Category[], string>>;
	/** Parses the url and gives info about the repo
	 *
	 * @param repoPath
	 * @returns
	 */
	info: (repoPath: string | Info) => Promise<Info>;
	/** Returns true if this provider matches the provided url
	 *
	 * @param repoPath
	 * @returns
	 */
	matches: (repoPath: string) => boolean;
}

const rawErrorMessage = (info: Info, filePath: string, defaultBranch: string) => {
	return Err(
		`There was an error fetching the \`${color.bold(filePath)}\` from ${color.bold(info.url)}.

${color.bold('This may be for one of the following reasons:')}
1. The \`${color.bold(filePath)}\` or containing repository doesn't exist
2. Your repository path is incorrect (wrong branch, wrong tag) default branches other than \`${color.bold(defaultBranch)}\` must be specified \`${color.bold('github/<owner>/<name>/tree/<branch>')}\`
3. You are using an expired access token or a token that doesn't have access to this repository
`
	);
};

/** Valid paths
 *
 *  `https://github.com/<owner>/<repo>/[tree]/[ref]`
 *
 *  `github/<owner>/<repo>/[tree]/[ref]`
 */
const github: Provider = {
	name: () => 'github',
	defaultBranch: () => 'main',
	resolveRaw: async (repoPath, resourcePath) => {
		const info = await github.info(repoPath);

		return new URL(
			resourcePath,
			`https://raw.githubusercontent.com/${info.owner}/${info.repoName}/refs/${info.refs}/${info.ref}/`
		);
	},
	fetchRaw: async (repoPath, resourcePath, { verbose } = {}) => {
		const info = await github.info(repoPath);

		const url = await github.resolveRaw(info, resourcePath);

		verbose?.(`Trying to fetch from ${url}`);

		try {
			const token = persisted.get().get(`${github.name()}-token`);

			const headers = new Headers();

			if (token !== undefined) {
				headers.append('Authorization', `token ${token}`);
			}

			const response = await fetch(url, { headers });

			verbose?.(`Got a response from ${url} ${response.status} ${response.statusText}`);

			if (!response.ok) {
				return rawErrorMessage(info, resourcePath, github.defaultBranch());
			}

			return Ok(await response.text());
		} catch (err) {
			verbose?.(`erroring in response ${err} `);

			return rawErrorMessage(info, resourcePath, github.defaultBranch());
		}
	},
	fetchManifest: async (repoPath) => {
		const manifest = await github.fetchRaw(repoPath, OUTPUT_FILE);

		if (manifest.isErr()) return Err(manifest.unwrapErr());

		const categories = v.safeParse(v.array(categorySchema), JSON.parse(manifest.unwrap()));

		if (!categories.success) {
			return Err(`Error parsing categories: ${categories.issues}`);
		}

		return Ok(categories.output);
	},
	info: async (repoPath) => {
		if (typeof repoPath !== 'string') return repoPath;

		const repo = repoPath.replaceAll(/(https:\/\/github.com\/)|(github\/)/g, '');

		const [owner, repoName, ...rest] = repo.split('/');

		let ref = github.defaultBranch();

		const token = persisted.get().get(`${github.name()}-token`);

		const octokit = new Octokit({ auth: token });

		if (rest[0] === 'tree') {
			ref = rest[1];
		} else {
			try {
				const { data: repo } = await octokit.rest.repos.get({ owner, repo: repoName });

				ref = repo.default_branch;
			} catch {
				// we just want to continue on blissfully unaware the user will get an error later
			}
		}

		// checks if the type of the ref is tags or heads
		let refs: 'heads' | 'tags' = 'heads';
		// no need to check if ref is main
		if (ref !== github.defaultBranch()) {
			try {
				const { data: tags } = await octokit.rest.git.listMatchingRefs({
					owner,
					repo: repoName,
					ref: 'tags',
				});

				if (tags.some((tag) => tag.ref === `refs/tags/${ref}`)) {
					refs = 'tags';
				}
			} catch {
				refs = 'heads';
			}
		}

		return {
			refs,
			url: repoPath,
			name: github.name(),
			repoName,
			owner,
			ref: ref,
			provider: github,
		};
	},
	matches: (repoPath) =>
		repoPath.toLowerCase().startsWith('https://github.com') ||
		repoPath.toLowerCase().startsWith('github'),
};

/** Valid paths
 *
 * `https://gitlab.com/ieedan/std`
 *
 * `https://gitlab.com/ieedan/std/-/tree/next`
 *
 * `https://gitlab.com/ieedan/std/-/tree/v2.0.0`
 *
 * `https://gitlab.com/ieedan/std/-/raw/v2.0.0/jsrepo-manifest.json?ref_type=tags`
 */
const gitlab: Provider = {
	name: () => 'gitlab',
	defaultBranch: () => 'main',
	resolveRaw: async (repoPath, resourcePath) => {
		const info = await gitlab.info(repoPath);

		return new URL(
			`${encodeURIComponent(resourcePath)}/raw?ref=${info.ref}`,
			`https://gitlab.com/api/v4/projects/${encodeURIComponent(`${info.owner}/${info.repoName}`)}/repository/files/`
		);
	},
	fetchRaw: async (repoPath, resourcePath, { verbose } = {}) => {
		const info = await github.info(repoPath);

		const url = await gitlab.resolveRaw(info, resourcePath);

		verbose?.(`Trying to fetch from ${url}`);

		try {
			const token = persisted.get().get(`${gitlab.name()}-token`);

			const headers = new Headers();

			if (token !== undefined) {
				headers.append('PRIVATE-TOKEN', `${token}`);
			}

			const response = await fetch(url, { headers });

			verbose?.(`Got a response from ${url} ${response.status} ${response.statusText}`);

			if (!response.ok) {
				return rawErrorMessage(info, resourcePath, gitlab.defaultBranch());
			}

			return Ok(await response.text());
		} catch {
			return rawErrorMessage(info, resourcePath, gitlab.defaultBranch());
		}
	},
	fetchManifest: async (repoPath) => {
		const manifest = await gitlab.fetchRaw(repoPath, OUTPUT_FILE);

		if (manifest.isErr()) return Err(manifest.unwrapErr());

		const categories = v.safeParse(v.array(categorySchema), JSON.parse(manifest.unwrap()));

		if (!categories.success) {
			return Err(`Error parsing categories: ${categories.issues}`);
		}

		return Ok(categories.output);
	},
	info: async (repoPath) => {
		if (typeof repoPath !== 'string') return repoPath;

		const repo = repoPath.replaceAll(/(https:\/\/gitlab.com\/)|(gitlab\/)/g, '');

		const [owner, repoName, ...rest] = repo.split('/');

		let ref = gitlab.defaultBranch();
		let refs: Info['refs'] = 'heads';

		if (rest[0] === '-' && rest[1] === 'tree') {
			if (rest[2].includes('?')) {
				const [tempRef, last] = rest[2].split('?');

				ref = tempRef;

				if (last.startsWith('ref_type=')) {
					if (last.slice(10) === 'tags') {
						refs = 'tags';
					}
				}
			} else {
				ref = rest[2];
			}
		} else {
			try {
				const token = persisted.get().get(`${gitlab.name()}-token`);

				const headers = new Headers();

				if (token !== undefined) {
					headers.append('Authorization', `Bearer ${token}`);
				}

				const response = await fetch(
					`https://gitlab.com/api/v4/projects/${encodeURIComponent(`${owner}/${repoName}`)}`,
					{
						headers,
					}
				);

				if (response.ok) {
					const data = await response.json();

					// @ts-ignore yes but we know
					ref = data.default_branch;
				}
			} catch {
				// well find out it isn't correct later with a better error
			}
		}

		return {
			refs,
			url: repoPath,
			name: gitlab.name(),
			repoName,
			owner,
			ref: ref,
			provider: gitlab,
		};
	},
	matches: (repoPath) =>
		repoPath.toLowerCase().startsWith('https://gitlab.com') ||
		repoPath.toLowerCase().startsWith('gitlab'),
};

/** Valid paths
 *
 * `https://bitbucket.org/ieedan/std/src/main/`
 *
 * `https://bitbucket.org/ieedan/std/src/next/`
 *
 * `https://bitbucket.org/ieedan/std/src/v2.0.0/`
 *
 */
const bitbucket: Provider = {
	name: () => 'bitbucket',
	defaultBranch: () => 'master',
	resolveRaw: async (repoPath, resourcePath) => {
		const info = await bitbucket.info(repoPath);

		return new URL(
			resourcePath,
			`https://api.bitbucket.org/2.0/repositories/${info.owner}/${info.repoName}/src/${info.ref}/`
		);
	},
	fetchRaw: async (repoPath, resourcePath, { verbose } = {}) => {
		const info = await bitbucket.info(repoPath);

		const url = await bitbucket.resolveRaw(info, resourcePath);

		verbose?.(`Trying to fetch from ${url}`);

		try {
			const token = persisted.get().get(`${bitbucket.name()}-token`);

			const headers = new Headers();

			if (token !== undefined) {
				headers.append('Authorization', `Bearer ${token}`);
			}

			const response = await fetch(url, { headers });

			verbose?.(`Got a response from ${url} ${response.status} ${response.statusText}`);

			if (!response.ok) {
				return rawErrorMessage(info, resourcePath, bitbucket.defaultBranch());
			}

			return Ok(await response.text());
		} catch {
			return rawErrorMessage(info, resourcePath, bitbucket.defaultBranch());
		}
	},
	fetchManifest: async (repoPath) => {
		const manifest = await bitbucket.fetchRaw(repoPath, OUTPUT_FILE);

		if (manifest.isErr()) return Err(manifest.unwrapErr());

		const categories = v.safeParse(v.array(categorySchema), JSON.parse(manifest.unwrap()));

		if (!categories.success) {
			return Err(`Error parsing categories: ${categories.issues}`);
		}

		return Ok(categories.output);
	},
	info: async (repoPath) => {
		if (typeof repoPath !== 'string') return repoPath;

		const repo = repoPath.replaceAll(/(https:\/\/bitbucket.org\/)|(bitbucket\/)/g, '');

		const [owner, repoName, ...rest] = repo.split('/');

		// pretty sure this just auto detects
		const refs = 'heads';

		let ref = bitbucket.defaultBranch();

		if (rest[0] === 'src') {
			ref = rest[1];
		} else {
			try {
				const token = persisted.get().get(`${bitbucket.name()}-token`);

				const headers = new Headers();

				if (token !== undefined) {
					headers.append('Authorization', `Bearer ${token}`);
				}

				const response = await fetch(
					`https://api.bitbucket.org/2.0/repositories/${owner}/${repoName}`,
					{
						headers,
					}
				);

				if (response.ok) {
					const data = await response.json();

					// @ts-ignore yes but we know
					ref = data.mainbranch.name;
				}
			} catch {
				// well find out it isn't correct later with a better error
			}
		}

		return {
			refs,
			url: repoPath,
			name: bitbucket.name(),
			repoName,
			owner,
			ref: ref,
			provider: bitbucket,
		};
	},
	matches: (repoPath) =>
		repoPath.toLowerCase().startsWith('https://bitbucket.org') ||
		repoPath.toLowerCase().startsWith('bitbucket'),
};

/** Valid paths
 *
 *  `azure/<org>/<project>/<repo>/(tags|heads)/<ref>`
 */
const azure: Provider = {
	name: () => 'azure',
	defaultBranch: () => 'main',
	resolveRaw: async (repoPath, resourcePath) => {
		const info = await azure.info(repoPath);

		const versionType = info.refs === 'tags' ? 'tag' : 'branch';

		return new URL(
			`https://dev.azure.com/${info.owner}/${info.projectName}/_apis/git/repositories/${info.repoName}/items?path=${resourcePath}&api-version=7.2-preview.1&versionDescriptor.version=${info.ref}&versionDescriptor.versionType=${versionType}`
		);
	},
	fetchRaw: async (repoPath, resourcePath, { verbose } = {}) => {
		const info = await azure.info(repoPath);

		const url = await azure.resolveRaw(info, resourcePath);

		verbose?.(`Trying to fetch from ${url}`);

		try {
			const token = persisted.get().get(`${azure.name()}-token`);

			const headers = new Headers();

			if (token !== undefined) {
				headers.append('Authorization', `Bearer ${token}`);
			}

			const response = await fetch(url, { headers });

			verbose?.(`Got a response from ${url} ${response.status} ${response.statusText}`);

			if (!response.ok) {
				return rawErrorMessage(info, resourcePath, azure.defaultBranch());
			}

			return Ok(await response.text());
		} catch (err) {
			verbose?.(`erroring in response ${err} `);

			return rawErrorMessage(info, resourcePath, azure.defaultBranch());
		}
	},
	fetchManifest: async (repoPath) => {
		const manifest = await azure.fetchRaw(repoPath, OUTPUT_FILE);

		if (manifest.isErr()) return Err(manifest.unwrapErr());

		const categories = v.safeParse(v.array(categorySchema), JSON.parse(manifest.unwrap()));

		if (!categories.success) {
			return Err(`Error parsing categories: ${categories.issues}`);
		}

		return Ok(categories.output);
	},
	info: async (repoPath) => {
		if (typeof repoPath !== 'string') return repoPath;

		const repo = repoPath.replaceAll(/(azure\/)/g, '');

		const [owner, project, repoName, ...rest] = repo.split('/');

		// azure/aidanbleser/std/std/heads/main

		let ref = azure.defaultBranch();

		// checks if the type of the ref is tags or heads
		let refs: 'heads' | 'tags' = 'heads';

		if (rest[0] === 'tags') {
			refs = 'tags';

			if (rest[1] && rest[1] !== '') {
				ref = rest[1];
			}
		}

		return {
			refs,
			url: repoPath,
			name: azure.name(),
			projectName: project,
			repoName,
			owner,
			ref: ref,
			provider: azure,
		};
	},
	matches: (repoPath) => repoPath.toLowerCase().startsWith('azure'),
};

const providers = [github, gitlab, bitbucket, azure];

const getProviderInfo = async (repo: string): Promise<Result<Info, string>> => {
	const provider = providers.find((provider) => provider.matches(repo));
	if (provider) {
		return Ok(await provider.info(repo));
	}

	return Err(
		`Only ${providers.map((p, i) => `${i === providers.length - 1 ? 'and' : ''}${color.cyan(p.name())}`).join(', ')} repositories are supported at this time!`
	);
};

const fetchBlocks = async (
	...repos: ResolvedRepo[]
): Promise<Result<Map<string, RemoteBlock>, { message: string; repo: string }>> => {
	const blocksMap = new Map<string, RemoteBlock>();
	for (const { path: repo, info } of repos) {
		const getManifestResult = await info.provider.fetchManifest(info);

		if (getManifestResult.isErr()) return Err({ message: getManifestResult.unwrapErr(), repo });

		const categories = getManifestResult.unwrap();

		for (const category of categories) {
			for (const block of category.blocks) {
				blocksMap.set(
					`${info.name}/${info.owner}/${info.repoName}/${category.name}/${block.name}`,
					{
						...block,
						sourceRepo: info,
					}
				);
			}
		}
	}

	return Ok(blocksMap);
};

export type ResolvedRepo = {
	path: string;
	info: Info;
};

const resolvePaths = async (
	...repos: string[]
): Promise<Result<ResolvedRepo[], { message: string; repo: string }>> => {
	const resolvedPaths: ResolvedRepo[] = [];

	for (const repo of repos) {
		const getProviderResult = await getProviderInfo(repo);

		if (getProviderResult.isErr()) return Err({ message: getProviderResult.unwrapErr(), repo });

		const providerInfo = getProviderResult.unwrap();

		resolvedPaths.push({ path: repo, info: providerInfo });
	}

	return Ok(resolvedPaths);
};

export { github, gitlab, bitbucket, azure, getProviderInfo, fetchBlocks, providers, resolvePaths };
