import { cancel, confirm, isCancel, log, outro } from '@clack/prompts';
import color from 'chalk';
import { Command, program } from 'commander';
import nodeMachineId from 'node-machine-id';
import * as v from 'valibot';
import * as ASCII from '../utils/ascii';
import { sleep } from '../utils/blocks/ts/sleep';
import { iFetch } from '../utils/fetch';
import { intro, spinner } from '../utils/prompts';
import * as jsrepo from '../utils/registry-providers/jsrepo';
import { TokenManager } from '../utils/token-manager';

const schema = v.object({
	token: v.optional(v.string()),
	logout: v.boolean(),
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

export const auth = new Command('auth')
	.description('Authenticate to jsrepo.com')
	.option('--logout', 'Execute the logout flow.', false)
	.option('--token <token>', 'The token to use for authenticating to this service.')
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (opts) => {
		const options = v.parse(schema, opts);

		await intro();

		await _auth(options);

		outro(color.green('All done!'));
	});

async function _auth(options: Options) {
	const tokenManager = new TokenManager();

	if (options.logout) {
		tokenManager.delete('jsrepo');
		log.success(`Logged out of ${ASCII.JSREPO_DOT_COM}!`);
		return;
	}

	if (options.token !== undefined) {
		tokenManager.set('jsrepo', options.token);
		log.success(`Logged into ${ASCII.JSREPO_DOT_COM}!`);
		return;
	}

	if (tokenManager.get('jsrepo') !== undefined) {
		const result = await confirm({
			message: 'You are currently signed into jsrepo do you want to sign out?',
			initialValue: false,
		});

		if (isCancel(result) || !result) {
			cancel('Canceled!');
			process.exit(0);
		}
	}

	const hardwareId = nodeMachineId.machineIdSync(true);

	let anonSessionId: string;

	try {
		const response = await iFetch(`${jsrepo.BASE_URL}/api/login/device`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ hardwareId }),
		});

		if (!response.ok) {
			throw new Error('There was an error creating the session');
		}

		const res = await response.json();

		anonSessionId = res.id;
	} catch (err) {
		program.error(color.red(err));
	}

	log.step(`Sign in at ${color.cyan(`${jsrepo.BASE_URL}/login/device/${anonSessionId}`)}`);

	const timeout = 1000 * 60 * 60 * 15; // 15 minutes

	const loading = spinner();

	const pollingTimeout = setTimeout(() => {
		loading.stop('You never signed in.');

		program.error(color.red('Session timed out try again!'));
	}, timeout);

	loading.start('Waiting for you to sign in...');

	while (true) {
		// wait initially cause c'mon ain't no way
		await sleep(5000); // wait 5 seconds

		const endpoint = `${jsrepo.BASE_URL}/api/login/device/${anonSessionId}`;

		try {
			const response = await iFetch(endpoint, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ hardwareId }),
			});

			if (!response.ok) continue;

			clearTimeout(pollingTimeout);

			const key = await response.text();

			tokenManager.set('jsrepo', key);

			loading.stop(`Logged into ${ASCII.JSREPO_DOT_COM}!`);

			break;
		} catch {
			// continue
		}
	}
}
