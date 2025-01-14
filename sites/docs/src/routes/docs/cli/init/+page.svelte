<script lang="ts">
	import { CodeSpan, DocHeader, SubHeading } from '$lib/components/site/docs';
	import { Snippet } from '$lib/components/ui/snippet';
	import OptionDocs from '../option-docs.svelte';
</script>

<DocHeader title="init" description="Initialize a registry or project with jsrepo." />
<Snippet command="execute" args={['jsrepo', 'init']} />
<SubHeading>Usage</SubHeading>
<p>Choose to initialize a registry or project.</p>
<Snippet command="execute" args={['jsrepo', 'init']} />
<p>Initialize a project.</p>
<Snippet command="execute" args={['jsrepo', 'init', '--project']} />
<p>Initialize a registry.</p>
<Snippet command="execute" args={['jsrepo', 'init', '--registry']} />
<p>Initialize a project with registries.</p>
<Snippet command="execute" args={['jsrepo', 'init', 'github/ieedan/std']} />
<SubHeading>Options</SubHeading>
<OptionDocs name="--repos" deprecated>
	{#snippet description()}
		The repositories to install the blocks from. (For project setup)
	{/snippet}
	{#snippet usage()}
		<Snippet
			command="execute"
			args={[
				'jsrepo',
				'init',
				'--repos',
				'github/ieedan/std',
				'github/ieedan/shadcn-svelte-extras'
			]}
		/>
	{/snippet}
</OptionDocs>
<OptionDocs name="--no-watermark">
	{#snippet description()}
		Sets the <CodeSpan>watermark</CodeSpan> config key to false. (For project setup)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'init', '--no-watermark']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--tests">
	{#snippet description()}
		Sets the <CodeSpan>tests</CodeSpan> config key to true. (For project setup)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'init', '--tests']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--formatter">
	{#snippet description()}
		Configure the formatter used when adding and updating blocks. (<CodeSpan>prettier</CodeSpan>, <CodeSpan
			>biome</CodeSpan
		>) (For project setup)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'init', '--formatter', 'prettier']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-P, --project">
	{#snippet description()}
		Takes you through the steps to initialize a project.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'init', '--project']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-R, --registry">
	{#snippet description()}
		Takes you through the steps to initialize a registry.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'init', '--registry']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--script">
	{#snippet description()}
		The name of the build script. (For registry setup)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'init', '--script', 'build:registry']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-y, --yes">
	{#snippet description()}
		Skips confirmation prompts. (Not including permissions prompts)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'init', '--yes']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--cwd">
	{#snippet description()}
		Run the current command on the provided directory absolute or relative.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'init', '--cwd', './packages/blocks']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-h, --help">
	{#snippet description()}
		Help with the command.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'init', '--help']} />
	{/snippet}
</OptionDocs>
