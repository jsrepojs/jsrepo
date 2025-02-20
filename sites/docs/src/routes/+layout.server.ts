import { GITHUB_TOKEN } from '$env/static/private';
import { Err, Ok, type Result } from '$lib/ts/types/result';
import { Octokit } from 'octokit';

export const load = async () => {
	const stars = getStars();

	const version = (await tryGetVersion()).unwrapOr('1.0.0');

	return {
		version,
		stars
	};
};

const getStars = async () => {
	const octokit = new Octokit({ auth: GITHUB_TOKEN });

	const repo = await octokit.rest.repos.get({ owner: 'ieedan', repo: 'jsrepo' });

	return repo.data.stargazers_count;
};

const tryGetVersion = async (): Promise<Result<string, string>> => {
	try {
		const response = await fetch(
			'https://raw.githubusercontent.com/ieedan/jsrepo/refs/heads/main/packages/cli/package.json'
		);

		if (!response.ok) {
			return Err('Error getting version');
		}

		const { version } = await response.json();

		return Ok(version);
	} catch (err) {
		return Err(`Error getting version: ${err}`);
	}
};
