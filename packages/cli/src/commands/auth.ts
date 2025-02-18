import { cancel, confirm, isCancel, log, outro, password, select } from '@clack/prompts';
import color from 'chalk';
import { Argument, Command } from 'commander';
import * as v from 'valibot';
import { intro } from '../utils/prompts';
import { TokenManager } from '../utils/token-manager';

const schema = v.object({
	token: v.optional(v.string()),
	logout: v.boolean(),
});

type Options = v.InferInput<typeof schema>;

const services = ['Anthropic', 'Azure', 'BitBucket', 'GitHub', 'GitLab', 'OpenAI'].sort();

const auth = new Command('auth')
	.description('Provide a token for access to private repositories.')
	.addArgument(
		new Argument('service', 'The service you want to authenticate to.')
			.choices(services.map((s) => s.toLowerCase()))
			.argOptional()
	)
	.option('--logout', 'Execute the logout flow.', false)
	.option('--token <token>', 'The token to use for authenticating to this service.')
	.action(async (service, opts) => {
		const options = v.parse(schema, opts);

		await intro();

		await _auth(service, options);

		outro(color.green('All done!'));
	});

const _auth = async (service: string | undefined, options: Options) => {
	let selectedService = services.find((s) => s.toLowerCase() === service?.toLowerCase());

	const storage = new TokenManager();

	if (options.logout) {
		if (selectedService !== undefined) {
			storage.delete(selectedService);
			log.success(`Logged out of ${selectedService}.`);
			return;
		}

		for (const serviceName of services) {
			if (storage.get(serviceName) === undefined) {
				log.step(color.gray(`Already logged out of ${serviceName}.`));
				continue;
			}

			const response = await confirm({
				message: `Logout of ${serviceName}?`,
				initialValue: true,
			});

			if (isCancel(response)) {
				cancel('Canceled!');
				process.exit(0);
			}

			if (!response) continue;

			storage.delete(serviceName);
		}
		return;
	}

	if (selectedService === undefined) {
		const response = await select({
			message: 'Which service do you want to authenticate to?',
			options: services.map((serviceName) => ({
				label: serviceName,
				value: serviceName,
			})),
			initialValue: services[0],
		});

		if (isCancel(response)) {
			cancel('Canceled!');
			process.exit(0);
		}

		selectedService = response;
	}

	if (options.token === undefined) {
		const response = await password({
			message: `Paste your ${color.bold(selectedService)} token:`,
			validate(value) {
				if (value.trim() === '') return 'Please provide a value';
			},
		});

		if (isCancel(response) || !response) {
			cancel('Canceled!');
			process.exit(0);
		}

		options.token = response;
	}

	storage.set(selectedService, options.token);

	log.success(`Logged into ${selectedService}.`);
};

export { auth };
