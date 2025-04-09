<script lang="ts">
	import { CodeSpan, DocHeader, SubHeading } from '$lib/components/site/docs';
	import { Snippet } from '$lib/components/ui/snippet';
	import OptionDocs from '../option-docs.svelte';
</script>

<DocHeader title="add" description="Add blocks to your project." />
<Snippet command="execute" args={['jsrepo', 'add']} />
<SubHeading>Usage</SubHeading>
<p>
	Choose a block to add from the registries in your <CodeSpan>jsrepo.json</CodeSpan> file:
</p>
<Snippet command="execute" args={['jsrepo', 'add']} />
<p>
	Add a partially qualified block using the registries in your <CodeSpan>jsrepo.json</CodeSpan> file:
</p>
<Snippet command="execute" args={['jsrepo', 'add', 'utils/math']} />
<p>Add a fully qualified block:</p>
<Snippet command="execute" args={['jsrepo', 'add', 'github/ieedan/std/utils/math']} />
<p>Include another registry in the blocks list:</p>
<Snippet command="execute" args={['jsrepo', 'add', '--repo', 'github/ieedan/std']} />
<SubHeading>Options</SubHeading>
<OptionDocs name="--watermark">
	{#snippet description()}
		Include a watermark at the top of added files. (For non-interactive zero-config adds)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--watermark', 'true']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--tests">
	{#snippet description()}
		Include tests along with the blocks when adding them. (For non-interactive zero-config adds)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--tests', 'true']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--formatter">
	{#snippet description()}
		Configure the formatter used when adding and updating blocks. (<CodeSpan>prettier</CodeSpan>, <CodeSpan
			>biome</CodeSpan
		>, <CodeSpan>none</CodeSpan>) (For non-interactive zero-config adds)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--formatter', 'prettier']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--paths">
	{#snippet description()}
		Allows you to specify where to install categories. A mirror of the paths functionality in the
		<CodeSpan>jsrepo.json</CodeSpan> file. (For non-interactive zero-config adds)
	{/snippet}
	{#snippet usage()}
		<Snippet
			command="execute"
			args={['jsrepo', 'add', '--paths', 'utils=./src/blocks/utils,ui=./src/blocks/ui']}
		/>
	{/snippet}
</OptionDocs>
<OptionDocs name="-E, --expand">
	{#snippet description()}
		Expands the diff past the limit set by <CodeSpan>--max-unchanged</CodeSpan> so that you can see the
		entire file.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--expand']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--max-unchanged">
	{#snippet description()}
		Sets a limit on the maximum unchanged lines to display in a diff before it is collapsed.
		<CodeSpan>default: 3</CodeSpan>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--max-unchanged', '10']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--repo">
	{#snippet description()}
		The repository to download the blocks from.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--repo', 'github/ieedan/std']} />
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
			args={['jsrepo', 'add', 'github/ieedan/std/utils/math', '--allow']}
		/>
	{/snippet}
</OptionDocs>
<OptionDocs name="-y, --yes">
	{#snippet description()}
		Skips confirmation prompts. (Not including permissions prompts)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'add', '--yes']} />
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
