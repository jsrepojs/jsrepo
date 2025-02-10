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
	<CodeSpan>x</CodeSpan> alias.
</p>
<Snippet command="execute" args={['jsrepo', 'x']} />
<p>Execute with args.</p>
<Snippet command="execute" args={['jsrepo', 'exec', '--', 'argument', '--yes']} />
<p>
	Execute a partially qualified script using the registries in your <CodeSpan>jsrepo.json</CodeSpan>
	file.
</p>
<Snippet command="execute" args={['jsrepo', 'exec', 'github/ieedan/scripts/general/hello']} />
<p>Include another registry in the scripts list.</p>
<Snippet command="execute" args={['jsrepo', 'exec', '--repo', 'github/ieedan/scripts']} />
<SubHeading>Options</SubHeading>
<OptionDocs name="--">
	{#snippet description()}
		<CodeSpan>--</CodeSpan> is a special option that will cause any args after it to be passed to the
		script instead of jsrepo.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'exec', '--', 'argument', '--yes']} />
	{/snippet}
</OptionDocs>
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
<OptionDocs name="--no-cache">
	{#snippet description()}
		Prevents caching the git provider state. Useful if the cache is incorrect due to changing the
		default branch for a repository or changing a tag into a head or vise versa.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--no-cache']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--verbose">
	{#snippet description()}
		More verbose logging. (May be used to troubleshoot issues)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--verbose']} />
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
