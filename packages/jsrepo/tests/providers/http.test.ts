import { describe, expect, it, vi } from 'vitest';
import { http } from '@/providers';
import type { AbsolutePath } from '@/utils/types';

describe('http', () => {
	it('correctly resolves url', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			text: vi.fn().mockResolvedValue('mock content'),
			headers: new Headers(),
		});

		const h = http();
		const httpState = await h.create('https://example.com', {
			cwd: process.cwd() as AbsolutePath,
			token: undefined,
		});

		await httpState.fetch('jsrepo-manifest.json', {
			token: undefined,
			fetch: mockFetch,
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch).toHaveBeenCalledWith(
			'https://example.com/jsrepo-manifest.json',
			expect.objectContaining({
				headers: {},
			})
		);
	});

	it('adds custom headers to the request', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			text: vi.fn().mockResolvedValue('mock content'),
			headers: new Headers(),
		});

		const h = http({
			baseUrl: 'https://example.com',
			headers: {
				'X-Custom-Header': 'custom value',
			},
		});
		const httpState = await h.create('https://example.com', {
			cwd: process.cwd() as AbsolutePath,
			token: undefined,
		});
		await httpState.fetch('jsrepo-manifest.json', {
			token: undefined,
			fetch: mockFetch,
		});
		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch).toHaveBeenCalledWith(
			'https://example.com/jsrepo-manifest.json',
			expect.objectContaining({
				headers: {
					'X-Custom-Header': 'custom value',
				},
			})
		);
	});

	it('authHeader overrides base provider headers', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			text: vi.fn().mockResolvedValue('mock content'),
			headers: new Headers(),
		});

		const h = http({
			baseUrl: 'https://example.com',
			headers: {
				'X-Custom-Header': 'base value',
				Authorization: 'base-auth-value',
			},
			authHeader: (token) => ({
				Authorization: `Bearer ${token}`,
			}),
		});
		const httpState = await h.create('https://example.com', {
			cwd: process.cwd() as AbsolutePath,
			token: undefined,
		});
		await httpState.fetch('jsrepo-manifest.json', {
			token: 'test-token-123',
			fetch: mockFetch,
		});
		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch).toHaveBeenCalledWith(
			'https://example.com/jsrepo-manifest.json',
			expect.objectContaining({
				headers: {
					'X-Custom-Header': 'base value',
					Authorization: 'Bearer test-token-123',
				},
			})
		);
	});
});
