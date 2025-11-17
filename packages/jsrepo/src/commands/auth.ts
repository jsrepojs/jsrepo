import {
	cancel,
	confirm,
	groupMultiselect,
	isCancel,
	log,
	multiselect,
	password,
	select,
	spinner,
	text,
} from '@clack/prompts';
import { Command } from 'commander';
import { err, ok, type Result } from 'nevereverthrow';
import pc from 'picocolors';
import { z } from 'zod';
import {
	commonOptions,
	defaultCommandOptionsSchema,
	parseOptions,
	tryCommand,
} from '@/commands/utils';
import { DEFAULT_PROVIDERS, type ProviderFactory } from '@/providers';
import type { Config } from '@/utils/config';
import { loadConfigSearch } from '@/utils/config/utils';
import { type CLIError, NoProviderFoundError } from '@/utils/errors';
import { initLogging, intro, outro } from '@/utils/prompts';
import { TokenManager } from '@/utils/token-manager';

export const schema = defaultCommandOptionsSchema.extend({
	token: z.string().optional(),
	logout: z.boolean(),
	verbose: z.boolean(),
});

export type AuthOptions = z.infer<typeof schema>;

export const auth = new Command('auth')
	.description('Authenticate to a provider or registry.')
	.argument('[provider]', 'The provider to authenticate to.')
	.option('--logout', 'Execute the logout flow.', false)
	.option('--token <token>', 'The token to use for authenticating to this provider.')
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.verbose)
	.action(async (provider, rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		intro();

		const config = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: false,
		});

		const result = await tryCommand(runAuth(provider, options, config?.config));

		outro(formatResult(result));
	});

export type AuthCommandResult = {
	type: 'logout' | 'login';
	provider: string;
	registry?: string;
};

export async function runAuth(
	providerArg: string,
	options: AuthOptions,
	config: Config | undefined
): Promise<Result<AuthCommandResult, CLIError>> {
	const { verbose, spinner: _spinner } = initLogging({ options });

	verbose(`Starting auth command${providerArg ? ` for provider: ${providerArg}` : ''}`);
	verbose(`Logout: ${options.logout}`);
	verbose(`Token provided: ${options.token ? 'yes' : 'no'}`);

	const providers = (config?.providers ?? DEFAULT_PROVIDERS).filter((p) => p.auth !== undefined);
	const registries = config?.registries ?? [];
	verbose(`Found ${providers.length} provider(s) with auth support: ${providers.map(p => p.name).join(', ')}`);
	verbose(`Found ${registries.length} registry/registries in config`);

	const registriesByProvider = new Map<string, string[]>();
	for (const registry of registries) {
		const provider = providers.find((p) => p.matches(registry));
		if (!provider) return err(new NoProviderFoundError(registry));
		registriesByProvider.set(provider.name, [
			...(registriesByProvider.get(provider.name) ?? []),
			registry,
		]);
	}
	verbose(`Mapped registries to providers: ${Array.from(registriesByProvider.entries()).map(([p, r]) => `${p}: ${r.length}`).join(', ')}`);

	let provider: ProviderFactory | undefined;
	if (!providerArg) {
		verbose(`No provider specified, prompting user to select`);
		const providerSelection = await select({
			message: 'Select a provider to authenticate to.',
			options: providers.map((p) => ({
				label: p.name,
				value: p.name,
			})),
		});

		if (isCancel(providerSelection)) {
			cancel('Canceled!');
			process.exit(0);
		}

		// we know it's valid because we checked for cancel
		provider = providers.find((p) => p.name === providerSelection)!;
		verbose(`User selected provider: ${provider.name}`);
	} else {
		provider = providers.find((p) => p.name === providerArg);
		if (!provider) return err(new NoProviderFoundError(providerArg));
		verbose(`Using provider: ${provider.name}`);
	}

	if (options.logout) {
		verbose(`Executing logout flow for provider: ${provider.name}`);
		return await logout(provider, verbose);
	}

	verbose(`Executing login flow for provider: ${provider.name}`);
	return await login(provider, { config, options, verbose });
}

async function logout(provider: ProviderFactory, verbose: (msg: string) => void): Promise<Result<AuthCommandResult, CLIError>> {
	const tokenManager = new TokenManager();
	verbose(`Checking token storage type: ${provider.auth!.tokenStoredFor}`);
	if (provider.auth!.tokenStoredFor === 'registry') {
		const registryTokens = tokenManager.getProviderRegistryTokens(provider);
		verbose(`Found ${Object.keys(registryTokens).length} registry token(s)`);
		if (Object.keys(registryTokens).length === 0) {
			verbose(`No tokens found, logout complete`);
			return ok({ type: 'logout', provider: provider.name, registry: undefined });
		}

		const registrySelection = await select({
			message: 'Select a registry to logout of.',
			options: Object.keys(registryTokens).map((registry) => ({
				label: registry,
				value: registry,
			})),
		});

		if (isCancel(registrySelection)) {
			cancel('Canceled!');
			process.exit(0);
		}

		verbose(`Deleting token for registry: ${registrySelection}`);
		tokenManager.delete(provider, registrySelection);
		return ok({ type: 'logout', provider: provider.name, registry: registrySelection });
	} else {
		verbose(`Deleting provider-level token`);
		tokenManager.delete(provider, undefined);
		return ok({ type: 'logout', provider: provider.name, registry: undefined });
	}
}

async function login(
	provider: ProviderFactory,
	{ config, options, verbose }: { config: Config | undefined; options: AuthOptions; verbose: (msg: string) => void }
): Promise<Result<AuthCommandResult, CLIError>> {
	const tokenManager = new TokenManager();
	verbose(`Checking token storage type: ${provider.auth!.tokenStoredFor}`);
	if (provider.auth!.tokenStoredFor === 'registry') {
		const registries = config?.registries ?? [];
		verbose(`Found ${registries.length} registry/registries in config`);
		let registry: string;
		if (registries.length === 0) {
			verbose(`No registries in config, prompting user for registry name`);
			const registrySelection = await text({
				message: 'Enter the name of the registry to authenticate to.',
				validate(value) {
					if (!value || value.trim() === '') return 'Please provide a value';
					if (!provider.matches(value))
						return 'Registry cannot be parsed by this provider';
				},
			});

			if (isCancel(registrySelection)) {
				cancel('Canceled!');
				process.exit(0);
			}

			registry = registrySelection;
			verbose(`User entered registry: ${registry}`);
		} else {
			verbose(`Prompting user to select from ${registries.length} registry/registries`);
			const registrySelection = await select({
				message: 'Select a registry to authenticate to.',
				options: [
					...registries.map((registry) => ({
						label: registry,
						value: registry,
					})),
					{
						label: 'Other',
						value: 'other',
					},
				],
			});

			if (isCancel(registrySelection)) {
				cancel('Canceled!');
				process.exit(0);
			}

			if (registrySelection === 'other') {
				const registrySelection = await text({
					message: 'Enter the name of the registry to authenticate to.',
					validate(value) {
						if (!value || value.trim() === '') return 'Please provide a value';
						if (!provider.matches(value))
							return 'Registry cannot be parsed by this provider';
					},
				});

				if (isCancel(registrySelection)) {
					cancel('Canceled!');
					process.exit(0);
				}

				registry = registrySelection;
				verbose(`User entered custom registry: ${registry}`);
			} else {
				registry = registrySelection;
				verbose(`User selected registry: ${registry}`);
			}
		}

		let token = options.token;
		if (!token) {
			verbose(`No token provided via option, prompting user`);
			if (provider.auth!.getToken) {
				token = await provider.auth!.getToken({
					registry,
					p: {
						confirm,
						multiselect,
						select,
						text,
						log,
						spinner,
						groupMultiselect,
						password,
						isCancel,
						cancel,
						color: pc,
					},
				});
			} else {
				const tokenResponse = await password({
					message: `Enter your token for ${pc.cyan(registry)}`,
					validate(value) {
						if (!value || value.trim() === '') return 'Please provide a value';
					},
				});

				if (isCancel(tokenResponse)) {
					cancel('Canceled!');
					process.exit(0);
				}

				token = tokenResponse;
			}
		}

		verbose(`Storing token for registry: ${registry}`);
		tokenManager.set(provider, registry, token);
		return ok({ type: 'login', provider: provider.name, registry });
	} else {
		verbose(`Provider-level authentication (no registry)`);
		let token = options.token;
		if (!token) {
			verbose(`No token provided via option, prompting user`);
			if (provider.auth!.getToken) {
				token = await provider.auth!.getToken({
					p: {
						confirm,
						multiselect,
						select,
						text,
						log,
						spinner,
						groupMultiselect,
						password,
						isCancel,
						cancel,
						color: pc,
					},
				});
			} else {
				const tokenResponse = await password({
					message: `Enter your token for ${pc.cyan(provider.name)}`,
					validate(value) {
						if (!value || value.trim() === '') return 'Please provide a value';
					},
				});

				if (isCancel(tokenResponse)) {
					cancel('Canceled!');
					process.exit(0);
				}

				token = tokenResponse;
			}
		}

		verbose(`Storing provider-level token`);
		tokenManager.set(provider, undefined, token);
		return ok({ type: 'login', provider: provider.name });
	}
}

export function formatResult({ type, provider, registry }: AuthCommandResult): string {
	const registryText = registry ? `${pc.cyan(registry)}` : `${pc.cyan(provider)}`;

	if (type === 'login') {
		return `Logged in to ${registryText}.`;
	} else {
		return `Logged out of ${registryText}.`;
	}
}
