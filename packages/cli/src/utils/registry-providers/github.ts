import { Octokit } from "octokit";
import { ParseOptions, RegistryProvider, RegistryProviderState } from ".";

const DEFAULT_BRANCH = "main";

export interface GitHubProviderState extends RegistryProviderState {
	owner: string;
	repoName: string;
	refs: "tags" | "heads";
	ref: string;
}

/** Valid paths
 *
 * `https://github.com/<owner>/<repo>`
 *
 * `github/<owner>/<repo>`
 *
 * `github/<owner>/<repo>/tree/<ref>`
 */
export const github: RegistryProvider = {
	name: "github",

	matches: (url) => {
		const lowercaseUrl = url.toLowerCase();

		// shorthand
		if (lowercaseUrl.startsWith("github")) return true;

		// full domain
		if (lowercaseUrl.startsWith("https://github.com")) return true;

		return false;
	},

	parse: (url, opts) => {
		const parsed = parseUrl(url, opts);

		const simpleUrl = `github/${parsed.owner}/${parsed.repoName}${parsed.ref ? `tree/${parsed.ref}` : ""}`;

		return {
			url: simpleUrl,
			specifier: parsed.specifier,
		};
	},

	state: async (url, { token } = {}) => {
		let { owner, repoName, ref } = parseUrl(url, { fullyQualified: false });

		const octokit = new Octokit({ auth: token });

		if (ref === undefined) {
			try {
				const { data: repo } = await octokit.rest.repos.get({ owner, repo: repoName });

				ref = repo.default_branch;
			} catch {
				// we just want to continue on blissfully unaware the user will get an error later
				ref = DEFAULT_BRANCH;
			}
		}

		// checks if the type of the ref is tags or heads
		let refs: "heads" | "tags" = "heads";
		// no need to check if ref is main
		if (ref !== DEFAULT_BRANCH) {
			try {
				const { data: tags } = await octokit.rest.git.listMatchingRefs({
					owner,
					repo: repoName,
					ref: "tags",
				});

				if (tags.some((tag) => tag.ref === `refs/tags/${ref}`)) {
					refs = "tags";
				}
			} catch {
				refs = "heads";
			}
		}

		return {
			owner,
			refs,
			ref,
			repoName,
			url,
			provider: github,
		} satisfies GitHubProviderState;
	},

	resolveRaw: async (state, resourcePath) => {
		// essentially assert that we are using the correct state
		if (state.provider.name !== github.name) {
			throw new Error(`You passed the incorrect state object (${state.provider.name}) to the github provider.`);
		}

		const { owner, repoName, refs, ref } = state as GitHubProviderState;

		return new URL(resourcePath, `https://raw.githubusercontent.com/${owner}/${repoName}/refs/${refs}/${ref}/`);
	},

	authHeader: (token: string) => ["Authorization", `token ${token}`],
};

const parseUrl = (
	url: string,
	{ fullyQualified = false }: ParseOptions
): { owner: string; repoName: string; ref?: string; specifier?: string } => {
	const repo = url.replaceAll(/(https:\/\/github.com\/)|(github\/)/g, "");

	let [owner, repoName, ...rest] = repo.split("/");

	let specifier: string | undefined = undefined;

	if (fullyQualified) {
		specifier = rest.slice(rest.length - 2).join("/");

		rest = rest.slice(0, rest.length - 2);
	}

	let ref: string | undefined;

	if (rest.length > 0) {
		if (rest[0] === "tree") {
			ref = rest[1];
		}
	}

	return { specifier, owner, repoName: repoName, ref };
};
