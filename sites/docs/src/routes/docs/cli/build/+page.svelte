<script lang="ts">
	import { CodeSpan, DocHeader, Link, SubHeading } from '$lib/components/site/docs';
	import { Snippet } from '$lib/components/ui/snippet';
	import OptionDocs from '../option-docs.svelte';
</script>

<DocHeader title="build" description="Build your repository into a jsrepo registry." />
<p>
	The <CodeSpan>build</CodeSpan> command builds the specified directories into a
	<CodeSpan>jsrepo-manifest.json</CodeSpan> file which jsrepo can use to locate blocks in your repository.
</p>
<Snippet command="execute" args={['jsrepo', 'build']} />
<SubHeading>Usage</SubHeading>
<Snippet command="execute" args={['jsrepo', 'build']} />
<SubHeading>Options</SubHeading>
<OptionDocs name="--dirs">
	{#snippet description()}
		The directories containing the categories. Corresponding config key: <Link
			href="/docs/jsrepo-build-config-json#dirs">dirs</Link
		>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--dirs', './src', './blocks']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--output-dir">
	{#snippet description()}
		Directory to copy the <CodeSpan>jsrepo-manifest.json</CodeSpan> and all required registry files to
		once the build is complete. This is useful when you want to host your registry on a custom domain
		from a different directory from where the code actually lives. Corresponding config key: <Link
			href="/docs/jsrepo-build-config-json#outputDir"
		>
			outputDir
		</Link>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--output-dir', './static/new-york']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--include-blocks">
	{#snippet description()}
		Include only the blocks with these names. Corresponding config key: <Link
			href="/docs/jsrepo-build-config-json#includeBlocks">includeBlocks</Link
		>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--include-blocks', 'math', 'logger']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--include-categories">
	{#snippet description()}
		Include only the categories with these names. Corresponding config key: <Link
			href="/docs/jsrepo-build-config-json#includeCategories">includeCategories</Link
		>
	{/snippet}
	{#snippet usage()}
		<Snippet
			command="execute"
			args={['jsrepo', 'build', '--include-categories', 'utils', 'scripts']}
		/>
	{/snippet}
</OptionDocs>
<OptionDocs name="--exclude-blocks">
	{#snippet description()}
		Do not include the blocks with these names. Corresponding config key: <Link
			href="/docs/jsrepo-build-config-json#excludeBlocks">excludeBlocks</Link
		>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--exclude-blocks', 'math', 'logger']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--exclude-categories">
	{#snippet description()}
		Do not include the categories with these names. Corresponding config key: <Link
			href="/docs/jsrepo-build-config-json#excludeCategories">excludeCategories</Link
		>
	{/snippet}
	{#snippet usage()}
		<Snippet
			command="execute"
			args={['jsrepo', 'build', '--exclude-categories', 'utils', 'scripts']}
		/>
	{/snippet}
</OptionDocs>

<OptionDocs name="--list-blocks">
	{#snippet description()}
		List only the blocks with these names. Corresponding config key: <Link
			href="/docs/jsrepo-build-config-json#listBlocks">listBlocks</Link
		>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--list-blocks', 'math', 'logger']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--list-categories">
	{#snippet description()}
		List only the categories with these names. Corresponding config key: <Link
			href="/docs/jsrepo-build-config-json#listCategories">listCategories</Link
		>
	{/snippet}
	{#snippet usage()}
		<Snippet
			command="execute"
			args={['jsrepo', 'build', '--list-categories', 'utils', 'scripts']}
		/>
	{/snippet}
</OptionDocs>
<OptionDocs name="--do-not-list-blocks">
	{#snippet description()}
		Do not list the blocks with these names. Corresponding config key: <Link
			href="/docs/jsrepo-build-config-json#doNotListBlocks">doNotListBlocks</Link
		>
	{/snippet}
	{#snippet usage()}
		<Snippet
			command="execute"
			args={['jsrepo', 'build', '--do-not-list-blocks', 'math', 'logger']}
		/>
	{/snippet}
</OptionDocs>
<OptionDocs name="--do-not-list-categories">
	{#snippet description()}
		Do not list the categories with these names. Corresponding config key: <Link
			href="/docs/jsrepo-build-config-json#doNotListCategories">doNotListCategories</Link
		>
	{/snippet}
	{#snippet usage()}
		<Snippet
			command="execute"
			args={['jsrepo', 'build', '--do-not-list-categories', 'utils', 'scripts']}
		/>
	{/snippet}
</OptionDocs>
<OptionDocs name="--exclude-deps">
	{#snippet description()}
		Prevent these dependencies from being included in the <CodeSpan>jsrepo-manifest.json</CodeSpan> file.
		Corresponding config key: <Link href="/docs/jsrepo-build-config-json#excludeDeps">
			excludeDeps
		</Link>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--exclude-deps', 'svelte', 'react']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--allow-subdirectories">
	{#snippet description()}
		Allow subdirectories to be built. Corresponding config key:
		<Link href="/docs/jsrepo-build-config-json#allowSubdirectories">allowSubdirectories</Link>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--allow-subdirectories']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--preview">
	{#snippet description()}
		Display a preview of the blocks list. Corresponding config key:
		<Link href="/docs/jsrepo-build-config-json#preview">preview</Link>
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--preview']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--verbose">
	{#snippet description()}
		More verbose logging. (May be used to troubleshoot issues)
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--verbose']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="--cwd">
	{#snippet description()}
		Run the current command on the provided directory absolute or relative.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--cwd', './sites/docs']} />
	{/snippet}
</OptionDocs>
<OptionDocs name="-h, --help">
	{#snippet description()}
		Help with the command.
	{/snippet}
	{#snippet usage()}
		<Snippet command="execute" args={['jsrepo', 'build', '--help']} />
	{/snippet}
</OptionDocs>
