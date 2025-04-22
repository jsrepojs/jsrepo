import { cancel, confirm, isCancel, log, outro, password, select, text } from '@clack/prompts';
import color from 'chalk';
import { Argument, Command } from 'commander';
import * as v from 'valibot';
import { getProjectConfig } from '../utils/config';
import { intro } from '../utils/prompts';
import { http } from '../utils/registry-providers';
import { TokenManager } from '../utils/token-manager';

const schema = v.object({
	token: v.optional(v.string()),
	logout: v.boolean(),
	cwd: v.string(),
});

type Options = v.InferInput<typeof schema>;

const services = [
	'Anthropic',
	'Azure',
	'BitBucket',
	'GitHub',
	'GitLab',
	'jsrepo',
	'OpenAI',
	'http',
].sort();

export const auth = new Command('auth')
	.description('Provide a token for access to private repositories.')
	.addArgument(
		new Argument('service', 'The service you want to authenticate to.')
			.choices(services.map((s) => s.toLowerCase()))
			.argOptional()
	)
	.option('--logout', 'Execute the logout flow.', false)
	.option('--token <token>', 'The token to use for authenticating to this service.')
	.option('--cwd <path>', 'The current working directory.', process.cwd())
	.action(async (service, opts) => {
		const options = v.parse(schema, opts);

		await intro();

		await _auth(service, options);

		outro(color.green('All done!'));
	});

async function _auth(service: string | undefined, options: Options) {
	const configuredRegistries: string[] = getProjectConfig(options.cwd).match(
		(v) => v.repos.filter(http.matches),
		() => []
	);

	let selectedService = services.find((s) => s.toLowerCase() === service?.toLowerCase());

	const storage = new TokenManager();

	// logout flow
	if (options.logout) {
		if (selectedService !== undefined) {
			if (selectedService === 'http') {
				await promptHttpLogout(storage);

				return;
			}

			storage.delete(selectedService);
			log.success(`Logged out of ${selectedService}.`);
			return;
		}

		for (const serviceName of services) {
			if (serviceName === 'http') {
				await promptHttpLogout(storage);
				continue;
			}

			if (storage.get(serviceName) === undefined) {
				log.step(color.gray(`Already logged out of ${color.bold(serviceName)}.`));
				continue;
			}

			const response = await confirm({
				message: `Logout of ${color.bold(serviceName)}?`,
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

	// login flow
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

		if (selectedService === 'http') {
			let selectedRegistry = 'Other';

			if (configuredRegistries.length > 0) {
				configuredRegistries.push('Other');

				const response = await select({
					message: 'Which registry do you want to authenticate to?',
					options: configuredRegistries.map((serviceName) => ({
						label: serviceName,
						value: serviceName,
					})),
					initialValue: services[0],
				});

				if (isCancel(response)) {
					cancel('Canceled!');
					process.exit(0);
				}

				selectedRegistry = new URL(response).origin;
			}

			// prompt for registry
			if (selectedRegistry === 'Other') {
				const response = await text({
					message: 'Please enter the registry url you want to authenticate to:',
					placeholder: 'https://example.com',
					validate(value) {
						if (value.trim() === '') return 'Please provide a value';

						try {
							// try to parse the url
							new URL(value);
						} catch {
							// if parsing fails return the error
							return 'Please provide a valid url';
						}
					},
				});

				if (isCancel(response)) {
					cancel('Canceled!');
					process.exit(0);
				}

				selectedRegistry = new URL(response).origin;
			}

			selectedService = `http-${selectedRegistry}`;
		}
	}

	let serviceName = selectedService;

	if (serviceName.startsWith('http')) {
		serviceName = serviceName.slice(5);
	}

	if (options.token === undefined) {
		const response = await password({
			message: `Paste your token for ${color.bold(serviceName)}:`,
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

	log.success(`Logged into ${color.bold(serviceName)}.`);
}

async function promptHttpLogout(storage: TokenManager) {
	// list all providers for logout
	const registries = storage.getHttpRegistriesWithTokens();

	if (registries.length === 0) {
		log.step(color.gray(`Already logged out of ${color.bold('http')}.`));
	}

	for (const registry of registries) {
		let registryUrl: URL;

		try {
			registryUrl = new URL(registry);
		} catch {
			continue;
		}

		const response = await confirm({
			message: `Logout of ${color.bold(registryUrl.origin)}?`,
			initialValue: true,
		});

		if (isCancel(response)) {
			cancel('Canceled!');
			process.exit(0);
		}

		if (!response) continue;

		storage.delete(`http-${registryUrl.origin}`);
	}
}
