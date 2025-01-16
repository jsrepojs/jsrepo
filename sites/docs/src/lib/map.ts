import * as Icons from '$lib/components/icons';

export type Category = {
	name: string;
	routes: Route[];
};

export type Route = {
	name: string;
	href: string;
	activeForSubdirectories?: boolean;
	hide?: boolean;
	icon?: typeof Icons.GitHub;
	routes?: Route[];
};

const categories: Category[] = [
	{
		name: 'General',
		routes: [
			{
				name: 'Home',
				href: '/'
			},
			{
				name: 'Docs',
				href: '/docs'
			},
			{
				name: 'Demos',
				href: '/demos'
			}
		]
	},
	{
		name: 'Getting Started',
		routes: [
			{
				name: 'Introduction',
				href: '/docs'
			},
			{
				name: 'Setup',
				href: '/docs/setup',
				activeForSubdirectories: true,
				routes: [
					{
						name: 'Project Setup',
						href: '/docs/setup/project'
					},
					{
						name: 'Registry Setup',
						href: '/docs/setup/registry'
					}
				]
			},
			{
				name: 'Registries',
				href: '/docs/registries'
			},
			{
				name: 'jsrepo.json',
				href: '/docs/jsrepo-json'
			},
			{
				name: 'jsrepo-build-config.json',
				href: '/docs/jsrepo-build-config-json'
			},
			{
				name: 'CLI',
				href: '/docs/cli',
				routes: [
					{
						name: 'add',
						href: '/docs/cli/add'
					},
					{
						name: 'auth',
						href: '/docs/cli/auth'
					},
					{
						name: 'build',
						href: '/docs/cli/build'
					},
					{
						name: 'exec',
						href: '/docs/cli/exec'
					},
					{
						name: 'init',
						href: '/docs/cli/init'
					},
					{
						name: 'test',
						href: '/docs/cli/test'
					},
					{
						name: 'update',
						href: '/docs/cli/update'
					}
				]
			},
			{
				name: 'Language Support',
				href: '/docs/language-support'
			},
			{
				name: 'Providers',
				href: '/docs/git-providers',
				activeForSubdirectories: true,
				routes: [
					{
						name: 'GitHub',
						href: '/docs/git-providers/github',
						icon: Icons.GitHub
					},
					{
						name: 'GitLab',
						href: '/docs/git-providers/gitlab',
						icon: Icons.GitLab
					},
					{
						name: 'BitBucket',
						href: '/docs/git-providers/bitbucket',
						icon: Icons.BitBucket
					},
					{
						name: 'AzureDevops',
						href: '/docs/git-providers/azure-devops',
						icon: Icons.AzureDevops
					},
					{
						name: 'Self Hosted',
						href: '/docs/git-providers/self-hosted'
					}
				]
			},
			{
				name: 'Private Repositories',
				href: '/docs/private-repositories'
			},
			{
				name: 'Badges',
				href: '/docs/badges'
			},
			{
				name: 'About',
				href: '/docs/about'
			}
		]
	}
];

export { categories };
