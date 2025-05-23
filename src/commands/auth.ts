import crypto from 'node:crypto';
import { cancel, confirm, isCancel, log, outro } from '@clack/prompts';
import color from 'chalk';
import { Command, program } from 'commander';
import { exec } from 'tinyexec';
import * as v from 'valibot';
import * as ASCII from '../utils/ascii';
import {
	APPLICATION_CLIENT_ID,
	APPLICATION_PORT,
	generatePKCE,
	listenForOAuthCallback,
} from '../utils/http';
import { intro, spinner } from '../utils/prompts';
import * as jsrepo from '../utils/registry-providers/jsrepo';
import { AccessTokenManager } from '../utils/token-manager';

const LISTEN_TIMEOUT = 1000 * 60 * 60 * 10; // 10 minutes (the same as in the recommended oidc spec)

const schema = v.object({
	token: v.optional(v.string()),
	logout: v.boolean(),
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

export const auth = new Command('auth')
	.description('Authenticate to jsrepo.com')
	.option('--logout', 'Execute the logout flow.', false)
	.option('--token <token>', 'A jsrepo API token associated with your account.')
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (opts) => {
		const options = v.parse(schema, opts);

		await intro({ refresh: false });

		await _auth(options);

		outro(color.green('All done!'));
	});

async function _auth(options: Options) {
	const tokenManager = new AccessTokenManager();

	if (options.logout) {
		logout(tokenManager);
		log.success(`Logged out of ${ASCII.JSREPO_DOT_COM}!`);
		return;
	}

	if (options.token !== undefined) {
		// jsrepo is the API token key
		tokenManager.set('jsrepo', { type: 'api', accessToken: options.token });
		log.success(`Logged into ${ASCII.JSREPO_DOT_COM}!`);
		return;
	}

	if (tokenManager.get('jsrepo') !== undefined || tokenManager.get('jsrepo-oidc') !== undefined) {
		const result = await confirm({
			message: 'You are currently signed into jsrepo do you want to sign out?',
			initialValue: false,
		});

		if (isCancel(result) || !result) {
			cancel('Canceled!');
			process.exit(0);
		}

		logout(tokenManager);
	}

	// start the oidc flow
	// https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce
	// https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce/add-login-using-the-authorization-code-flow-with-pkce#bdaf1735d9ad4a3d8d11bc70caf77844_node

	const redirectUri = `http://localhost:${APPLICATION_PORT}/callback`;
	const scope = 'openid profile email offline_access';
	const authEndpoint = new URL('api/auth/oauth2/authorize', jsrepo.BASE_URL);

	const { codeChallenge, codeVerifier } = generatePKCE();

	const params = new URLSearchParams({
		client_id: APPLICATION_CLIENT_ID,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope,
		prompt: 'consent',
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		state: crypto.randomBytes(16).toString('hex'),
	});

	const url = `${authEndpoint.toString()}?${params.toString()}`;

	openInBrowser(url);

	const loading = spinner();

	const serverTimeout = setTimeout(() => {
		loading.stop('You never signed in.');

		program.error(color.red('Session timed out try again!'));
	}, LISTEN_TIMEOUT);

	loading.start('Waiting for you to sign in...');

	const { code } = (await listenForOAuthCallback()).match(
		(v) => v,
		(err) => {
			loading.stop(color.red(err));

			process.exit(1);
		}
	);

	clearTimeout(serverTimeout);

	const tokens = await jsrepo.getAuthToken({
		grant_type: 'authorization_code',
		code_verifier: codeVerifier,
		code,
		client_id: APPLICATION_CLIENT_ID,
		redirect_uri: redirectUri,
	});

	if (tokens.error) {
		program.error(color.red(`${tokens.error}: ${tokens.error_description}`));
	}

	tokenManager.set(jsrepo.jsrepo.name, {
		type: 'default',
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		idToken: tokens.id_token,
		expires: tokens.expires_in * 1000 + Date.now(),
	});

	loading.stop(`Logged into ${ASCII.JSREPO_DOT_COM}!`);
}

function openInBrowser(url: string) {
	const start =
		process.platform === 'darwin'
			? 'open'
			: process.platform === 'win32'
				? 'start'
				: 'xdg-open';
	exec(start, [url]);
}

function logout(tokenManager: AccessTokenManager) {
	tokenManager.delete('jsrepo');
	tokenManager.delete('jsrepo-oidc');
}
