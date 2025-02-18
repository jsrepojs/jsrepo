<script lang="ts">
	import { DocHeader, SubHeading } from '$lib/components/site/docs';
	import { Snippet } from '$lib/components/ui/snippet';
	import OptionDocs from '../option-docs.svelte';
</script>

<DocHeader
	title="auth"
	description="Configure access tokens for private repository access and update with AI."
/>
<Snippet command="execute" args={['jsrepo', 'auth']} />
<SubHeading>Usage</SubHeading>
<p>Choose a service and provide a token:</p>
<Snippet command="execute" args={['jsrepo', 'auth']} />
<p>Authenticate to a specific service:</p>
<Snippet command="execute" args={['jsrepo', 'auth', 'github']} />
<p>Choose a service to logout from:</p>
<Snippet command="execute" args={['jsrepo', 'auth', '--logout']} />
<p>Logout from a specific service:</p>
<Snippet command="execute" args={['jsrepo', 'auth', 'github', '--logout']} />
<SubHeading>Options</SubHeading>
<OptionDocs name="--token">
	{#snippet description()}
		The token to use for authenticating to your service.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'auth', '--token', 'xxxxxxxxxxx']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--logout">
	{#snippet description()}
		Executes the logout flow.
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
