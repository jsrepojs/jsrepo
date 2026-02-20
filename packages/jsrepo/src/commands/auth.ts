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
import path from 'pathe';
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
import { type CLIError, JsrepoError, NoProviderFoundError } from '@/utils/errors';
import { runAfterHooks, runBeforeHooks } from '@/utils/hooks';
import { initLogging, intro, outro } from '@/utils/prompts';
import { TokenManager } from '@/utils/token-manager';

export const schema = defaultCommandOptionsSchema.extend({
	registry: z.string().optional(),
	token: z.string().optional(),
	logout: z.boolean(),
	verbose: z.boolean(),
});

export type AuthOptions = z.infer<typeof schema>;

export const auth = new Command('auth')
	.description('Authenticate to a provider or registry.')
	.argument('[provider]', 'The provider to authenticate to.')
	.option('--logout', 'Execute the logout flow.', false)
	.option('--registry <registry>', 'The registry to authenticate to.')
	.option('--token <token>', 'The token to use for authenticating to this provider.')
	.addOption(commonOptions.cwd)
	.addOption(commonOptions.verbose)
	.action(async (provider, rawOptions) => {
		const options = parseOptions(schema, rawOptions);

		const configResult = await loadConfigSearch({
			cwd: options.cwd,
			promptForContinueIfNull: false,
		});

		const config = configResult?.config ?? ({} as Config);
		const cwd = configResult
			? (path.dirname(configResult.path) as import('@/utils/types').AbsolutePath)
			: options.cwd;

		await runBeforeHooks(
			config,
			{ command: 'auth', options: { ...options, cwd } },
			{ cwd, yes: false }
		);

		intro();

		const result = await tryCommand(runAuth(provider, options, configResult?.config));

		outro(formatResult(result));

		await runAfterHooks(
			config,
			{ command: 'auth', options: { ...options, cwd }, result },
			{ cwd }
		);
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
	const { verbose: _verbose, spinner: _spinner } = initLogging({ options });

	const providers = (config?.providers ?? DEFAULT_PROVIDERS).filter((p) => p.auth !== undefined);

	let provider: ProviderFactory | undefined;
	if (!providerArg) {
		if (options.registry) {
			provider = providers.find((p) => p.matches(options.registry));
			if (!provider) return err(new NoProviderFoundError(options.registry));
		} else {
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
		}
	} else {
		provider = providers.find((p) => p.name === providerArg);
		if (!provider) return err(new NoProviderFoundError(providerArg));
	}

	if (options.registry && !provider.matches(options.registry)) {
		return err(
			new JsrepoError(
				`Registry ${pc.bold(options.registry)} cannot be parsed by provider ${pc.bold(provider.name)}.`,
				{
					suggestion: `Pass a registry that matches ${pc.bold(provider.name)} or omit the provider argument.`,
				}
			)
		);
	}

	if (options.logout) return await logout(provider, options);

	return await login(provider, { config, options });
}

async function logout(
	provider: ProviderFactory,
	options: AuthOptions
): Promise<Result<AuthCommandResult, CLIError>> {
	const tokenManager = new TokenManager();
	if (provider.auth!.tokenStoredFor === 'registry') {
		if (options.registry) {
			tokenManager.delete(provider, options.registry);
			return ok({ type: 'logout', provider: provider.name, registry: options.registry });
		}

		const registryTokens = tokenManager.getProviderRegistryTokens(provider);
		if (Object.keys(registryTokens).length === 0) {
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

		tokenManager.delete(provider, registrySelection);
		return ok({ type: 'logout', provider: provider.name, registry: registrySelection });
	} else {
		tokenManager.delete(provider, undefined);
		return ok({ type: 'logout', provider: provider.name, registry: undefined });
	}
}

async function login(
	provider: ProviderFactory,
	{ config, options }: { config: Config | undefined; options: AuthOptions }
): Promise<Result<AuthCommandResult, CLIError>> {
	const tokenManager = new TokenManager();
	if (provider.auth!.tokenStoredFor === 'registry') {
		const registries = config?.registries ?? [];
		let registry = options.registry;
		if (!registry) {
			if (registries.length === 0) {
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
			} else {
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
				} else {
					registry = registrySelection;
				}
			}
		}

		let token = options.token;
		if (!token) {
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

		tokenManager.set(provider, registry, token);
		return ok({ type: 'login', provider: provider.name, registry });
	} else {
		let token = options.token;
		if (!token) {
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
