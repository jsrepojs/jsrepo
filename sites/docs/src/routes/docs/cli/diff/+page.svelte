<script lang="ts">
	import { CodeSpan, DocHeader, SubHeading } from '$lib/components/site/docs';
	import { Snippet } from '$lib/components/ui/snippet';
	import OptionDocs from '../option-docs.svelte';
</script>

<DocHeader
	title="diff"
	description="Compare the blocks in the registry against your local blocks."
/>
<Snippet command="execute" args={['jsrepo', 'diff']} />
<SubHeading>Usage</SubHeading>
<Snippet command="execute" args={['jsrepo', 'diff']} />
<SubHeading>Options</SubHeading>
<OptionDocs name="-E, --expand">
	{#snippet description()}
		Expands the diff past the limit set by <CodeSpan>--max-unchanged</CodeSpan> so that you can see the
		entire file.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'diff', '--expand']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--max-unchanged">
	{#snippet description()}
		Sets a limit on the maximum unchanged lines to display in a diff before it is collapsed.
		<CodeSpan>default: 3</CodeSpan>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'diff', '--max-unchanged', '10']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--repo">
	{#snippet description()}
		The repository to download the blocks from.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'diff', '--repo', 'github/ieedan/std']} />
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
			args={['jsrepo', 'diff', '--repo', 'github/ieedan/std', '--allow']}
		/>
	{/snippet}
</OptionDocs>
<OptionDocs name="--cwd">
	{#snippet description()}
		Run the current command on the provided directory absolute or relative.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--cwd', './sites/docs']} />
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
