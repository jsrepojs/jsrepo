<script lang="ts">
	import { CodeSpan, DocHeader, SubHeading } from '$lib/components/site/docs';
	import { Snippet } from '$lib/components/ui/snippet';
	import OptionDocs from '../option-docs.svelte';
</script>

<DocHeader
	title="update"
	description="Interactively update your blocks to the latest code in the registry."
/>
<Snippet command="execute" args={['jsrepo', 'update']} />
<SubHeading>Usage</SubHeading>
<p>Choose which blocks to update.</p>
<Snippet command="execute" args={['jsrepo', 'update']} />
<p>Update a specific block.</p>
<Snippet command="execute" args={['jsrepo', 'update', 'utils/math']} />
<SubHeading>Options</SubHeading>
<OptionDocs name="--all">
	{#snippet description()}
		Update all installed components.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'update', '--all']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-E, --expand">
	{#snippet description()}
		Expands the diff past the limit set by <CodeSpan>--max-unchanged</CodeSpan> so that you can see the
		entire file.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'update', '--expand']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--max-unchanged">
	{#snippet description()}
		Sets a limit on the maximum unchanged lines to display in a diff before it is collapsed.
		<CodeSpan>default: 3</CodeSpan>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'update', '--max-unchanged', '10']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-n, --no">
	{#snippet description()}
		Do update any blocks.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'update', '--no']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--repo">
	{#snippet description()}
		The repository to download the blocks from.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'update', '--repo', 'github/ieedan/std']} />
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
			args={['jsrepo', 'update', 'github/ieedan/std/utils/math', '--allow']}
		/>
	{/snippet}
</OptionDocs>
<OptionDocs name="-y, --yes">
	{#snippet description()}
		Skips confirmation prompts. (Not including permissions prompts)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'update', '--yes']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--verbose">
	{#snippet description()}
		More verbose logging. (May be used to troubleshoot issues)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'update', '--verbose']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--cwd">
	{#snippet description()}
		Run the current command on the provided directory absolute or relative.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'update', '--cwd', './sites/docs']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-h, --help">
	{#snippet description()}
		Help with the command.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'update', '--help']} />
	{/snippet}
</OptionDocs>
