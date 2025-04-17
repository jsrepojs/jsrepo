import { GITHUB_TOKEN } from '$env/static/private';
// import { Err, Ok, type Result } from '$lib/ts/result';
import { Octokit } from 'octokit';

export const load = async () => {
	const stars = getStars();

	// const version = tryGetVersion().then((ver) => ver.unwrapOr('1.0.0'));

	return {
		// version,
		stars
	};
};

async function getStars() {
	const octokit = new Octokit({ auth: GITHUB_TOKEN });

	const repo = await octokit.rest.repos.get({ owner: 'ieedan', repo: 'jsrepo' });

	return repo.data.stargazers_count;
}

// async function tryGetVersion(): Promise<Result<string, string>> {
// 	try {
// 		const response = await fetch(
// 			'https://raw.githubusercontent.com/ieedan/jsrepo/refs/heads/main/packages/cli/package.json'
// 		);

// 		if (!response.ok) {
// 			return Err('Error getting version');
// 		}

// 		const { version } = await response.json();

// 		return Ok(version);
// 	} catch (err) {
// 		return Err(`Error getting version: ${err}`);
// 	}
// }
