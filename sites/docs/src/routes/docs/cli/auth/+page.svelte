<script lang="ts">
	import { CodeSpan, DocHeader, SubHeading } from '$lib/components/site/docs';
	import { Snippet } from '$lib/components/ui/snippet';
	import OptionDocs from '../option-docs.svelte';
</script>

<DocHeader title="auth" description="Configure access tokens for private repository access." />
<Snippet command="execute" args={['jsrepo', 'auth']} />
<SubHeading>Usage</SubHeading>
<Snippet command="execute" args={['jsrepo', 'auth']} />
<SubHeading>Options</SubHeading>
<OptionDocs name="--token">
	{#snippet description()}
		The token to use for authenticating to your provider.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'auth', '--token', 'xxxxxxxxxxx']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--provider">
	{#snippet description()}
		The provider to store the token for. (<CodeSpan>github</CodeSpan>, <CodeSpan>gitlab</CodeSpan>,
		<CodeSpan>bitbucket</CodeSpan>, <CodeSpan>azure</CodeSpan>).
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'auth', '--provider', 'github']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--logout">
	{#snippet description()}
		Changes to an interactive logout where you choose the provider to remove the token from.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'auth', '--logout']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-h, --help">
	{#snippet description()}
		Help with the command.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--help']} />
	{/snippet}
</OptionDocs>
