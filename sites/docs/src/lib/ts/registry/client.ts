import * as Icons from '$lib/components/icons';
import { Server } from '@lucide/svelte';
import { selectProvider } from 'jsrepo';
import type { Component } from 'svelte';

export function getIcon(registryUrl: string): Component | undefined {
	const provider = selectProvider(registryUrl);

	if (!provider) return undefined;

	if (provider.name === 'github') {
		return Icons.GitHub;
	} else if (provider.name === 'gitlab') {
		return Icons.GitLab;
	} else if (provider.name === 'bitbucket') {
		return Icons.BitBucket;
	} else if (provider.name === 'azure') {
		return Icons.AzureDevops;
	} else if (provider.name === 'http') {
		return Server;
	}

	return undefined;
}
