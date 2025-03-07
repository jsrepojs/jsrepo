<script lang="ts">
	import { CodeSpan, DocHeader, Jsrepo, Link, SubHeading } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import { Snippet } from '$lib/components/ui/snippet';
	import { UseAwait } from '$lib/hooks/use-await.svelte.js';

	let { data } = $props();

	const version = new UseAwait(data.version, '1.0.0');
</script>

<DocHeader title="jsrepo.json" description="Configuration for your project." />
<p>
	<CodeSpan>jsrepo.json</CodeSpan> holds the configuration for your project.
</p>
<p>
	You can create a <CodeSpan>jsrepo.json</CodeSpan> by running the init command with the
	<CodeSpan>--project</CodeSpan> flag:
</p>
<Snippet command="execute" args={['jsrepo', 'init', '--project']} />

<SubHeading>$schema</SubHeading>
<p>
	<CodeSpan>$schema</CodeSpan> is tracked with the cli so you can use a specific version using
	<CodeSpan>unpkg</CodeSpan>:
</p>
<Code
	lang="json"
	code={`{
	"$schema": "https://unpkg.com/jsrepo@${version.current}/schemas/project-config.json"
}`}
/>

<SubHeading>configFiles</SubHeading>
<p>Where to add specific config files in your project.</p>
<Code
	lang="json"
	code={`{
	"configFiles": {
	  "app.css": "./src/app.css"
	}
}`}
/>

<SubHeading>formatter</SubHeading>
<p>The formatter to use when writing files in your project.</p>
<Code
	lang="json"
	code={`{
	"formatter": "prettier" / "biome" / undefined
}`}
/>
<p>
	<Jsrepo /> can format your files following your local config before adding them to your repository.
	Currently the only supported formatters are
	<Link target="_blank" href="https://prettier.io/">Prettier</Link> and
	<Link target="_blank" href="https://biomejs.dev/">Biome</Link>.
</p>

<SubHeading>includeTests</SubHeading>
<p>Whether or not to include test files when installing blocks.</p>
<Code
	lang="json"
	code={`{
	"includeTests": false
}`}
/>

<SubHeading>paths</SubHeading>
<p>Where to add specific categories in your project.</p>
<Code
	lang="json"
	code={`{
	"paths": {
	  "*": "./src/blocks",
	  "components": "$lib/components",
	  "hooks": "$lib/hooks"
	}
}`}
/>

<SubHeading>repos</SubHeading>
<p>
	<CodeSpan>repos</CodeSpan> allows you to specify different registries to install blocks from. All of
	the blocks from each registry will be listed when you run <CodeSpan>add</CodeSpan>.
</p>
<Code
	lang="json"
	code={`{
	"repos": [
	  "gitlab/ieedan/std",
	  "github/ieedan/shadcn-phone-input-svelte"
	]
}`}
/>

<SubHeading>watermark</SubHeading>
<p>Whether or not to add a watermark to installed blocks.</p>
<Code
	lang="json"
	code={`{
	"watermark": true
}`}
/>
<p>
	When true jsrepo adds a watermark to each block that includes the registry that it was added from
	from.
</p>
<Code
	lang="typescript"
	code={`/*
	Installed from github/ieedan/std
*/
  
export type Point = {
	x: number;
	y: number;
};`}
/>
