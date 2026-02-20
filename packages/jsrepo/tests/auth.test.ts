import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clack/prompts', () => ({
	intro: vi.fn(),
	outro: vi.fn(),
	cancel: vi.fn(),
	confirm: vi.fn(),
	groupMultiselect: vi.fn(),
	isCancel: vi.fn(() => false),
	log: {
		info: vi.fn(),
		step: vi.fn(),
		success: vi.fn(),
		message: vi.fn(),
	},
	multiselect: vi.fn(),
	password: vi.fn(),
	select: vi.fn(),
	spinner: vi.fn(() => ({
		start: vi.fn(),
		stop: vi.fn(),
		message: vi.fn(),
		isCancelled: false,
	})),
	taskLog: vi.fn(() => ({
		message: vi.fn(),
		success: vi.fn(),
		error: vi.fn(),
	})),
	text: vi.fn(),
}));

import * as prompts from '@clack/prompts';
import { runAuth } from '@/commands/auth';
import type { ProviderFactory } from '@/providers';
import type { Config } from '@/utils/config';
import { JsrepoError } from '@/utils/errors';
import { TokenManager } from '@/utils/token-manager';
import type { AbsolutePath } from '@/utils/types';

const REGISTRY = 'https://registry.example.com/team/ui';

function createRegistryProvider(name: string): ProviderFactory {
	return {
		name,
		matches: (url) => url.startsWith('https://registry.example.com'),
		create: async () => ({
			fetch: async () => '',
		}),
		auth: {
			tokenStoredFor: 'registry',
		},
	};
}

function createConfig(providers: ProviderFactory[]): Config {
	return {
		providers,
		registries: [REGISTRY],
		registry: [],
		languages: [],
		transforms: [],
		paths: {},
	};
}

describe('auth --registry', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('infers provider from registry and logs in without registry prompts', async () => {
		const provider = createRegistryProvider('http');
		const config = createConfig([provider]);
		const setSpy = vi.spyOn(TokenManager.prototype, 'set').mockImplementation(() => {});

		const result = await runAuth(
			'',
			{
				cwd: process.cwd() as AbsolutePath,
				logout: false,
				registry: REGISTRY,
				token: 'token-value',
				verbose: false,
			},
			config
		);

		expect(result.isOk()).toBe(true);
		if (result.isErr()) return;

		expect(result.value).toEqual({
			type: 'login',
			provider: 'http',
			registry: REGISTRY,
		});
		expect(setSpy).toHaveBeenCalledWith(provider, REGISTRY, 'token-value');
		expect(prompts.select).not.toHaveBeenCalled();
	});

	it('returns an error when provider cannot parse registry', async () => {
		const provider = createRegistryProvider('http');
		const config = createConfig([provider]);

		const result = await runAuth(
			'http',
			{
				cwd: process.cwd() as AbsolutePath,
				logout: false,
				registry: '@scope/registry',
				token: 'token-value',
				verbose: false,
			},
			config
		);

		expect(result.isErr()).toBe(true);
		if (result.isOk()) return;

		expect(result.error).toBeInstanceOf(JsrepoError);
		expect(result.error.message).toContain('cannot be parsed by provider');
	});

	it('logs out of the provided registry without selection prompts', async () => {
		const provider = createRegistryProvider('http');
		const config = createConfig([provider]);
		const deleteSpy = vi.spyOn(TokenManager.prototype, 'delete').mockImplementation(() => {});
		const getRegistryTokensSpy = vi
			.spyOn(TokenManager.prototype, 'getProviderRegistryTokens')
			.mockReturnValue({ [REGISTRY]: 'token-value' });

		const result = await runAuth(
			'http',
			{
				cwd: process.cwd() as AbsolutePath,
				logout: true,
				registry: REGISTRY,
				token: undefined,
				verbose: false,
			},
			config
		);

		expect(result.isOk()).toBe(true);
		if (result.isErr()) return;

		expect(result.value).toEqual({
			type: 'logout',
			provider: 'http',
			registry: REGISTRY,
		});
		expect(deleteSpy).toHaveBeenCalledWith(provider, REGISTRY);
		expect(getRegistryTokensSpy).not.toHaveBeenCalled();
		expect(prompts.select).not.toHaveBeenCalled();
	});
});
