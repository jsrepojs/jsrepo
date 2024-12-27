<script lang="ts">
	import { CodeSpan, DocHeader, SubHeading } from '$lib/components/site/docs';
	import { Snippet } from '$lib/components/ui/snippet';
	import OptionDocs from '../option-docs.svelte';
</script>

<DocHeader title="exec" description="Execute a block as a script with arguments." />
<Snippet command="execute" args={['jsrepo', 'exec']} />
<SubHeading>Usage</SubHeading>
<p>
	Choose a script to execute from the registries in your <CodeSpan>jsrepo.json</CodeSpan> file.
</p>
<Snippet command="execute" args={['jsrepo', 'exec']} />
<p>
	Execute a partially qualified script using the registries in your <CodeSpan>jsrepo.json</CodeSpan> file.
</p>
<Snippet command="execute" args={['jsrepo', 'exec', 'github/ieedan/scripts/general/hello']} />
<p>Include another registry in the scripts list.</p>
<Snippet command="execute" args={['jsrepo', 'exec', '--repo', 'github/ieedan/scripts']} />
<SubHeading>Options</SubHeading>
<OptionDocs name="--repo">
	{#snippet description()}
		The repository to download the scripts from.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'exec', '--repo', 'github/ieedan/scripts']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-A, --allow">
	{#snippet description()}
		Allow jsrepo to download code from the provided repo. This skips the initial confirmation prompt
		when attempting to download a block from a registry not listed in the
		<CodeSpan>jsrepo.json</CodeSpan> file.
	{/snippet}
	{#snippet usage()}
		<Snippet
			command="execute"
			args={['jsrepo', 'exec', '--repo', 'github/ieedan/scripts', '--allow']}
		/>
	{/snippet}
</OptionDocs>
<OptionDocs name="--cwd">
	{#snippet description()}
		Run the current command on the provided directory absolute or relative.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'exec', '--cwd', './sites/docs']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-h, --help">
	{#snippet description()}
		Help with the command.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'exec', '--help']} />
	{/snippet}
</OptionDocs>