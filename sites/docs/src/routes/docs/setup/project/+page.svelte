<script lang="ts">
	import { CodeSpan, DocHeader, Jsrepo } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import { Snippet } from '$lib/components/ui/snippet';
	import { UseAwait } from '$lib/hooks/use-await.svelte.js';

	let { data } = $props();

	const version = new UseAwait(data.version, '1.0.0');
</script>

<DocHeader
	title="Project Setup"
	description="Setup your project to install blocks from a registry."
/>
<p>
	To install blocks from a registry you will need to create a <CodeSpan>jsrepo.json</CodeSpan> file.
</p>
<p>
	This file tells <Jsrepo /> where to get the blocks as well as where and how to install them.
</p>
<p>
	To setup the <CodeSpan>jsrepo.json</CodeSpan> file you can run the <CodeSpan>init</CodeSpan> command
	to take your through initial setup.
</p>
<Snippet command="execute" args={['jsrepo', 'init', '--project']} />
<Code
	hideLines
	hideCopy
	code={`┌   jsrepo  v${version.current}
│
◇  Where should we add the blocks?
│  ./src/blocks
│
◇  Add a repo?
│  Yes
│
◇  Where should we download the blocks from?
│  github/ieedan/std
│
◇  Add another repo?
│  No
│
◇  What formatter would you like to use?
│  Prettier
│
◇  Wrote config to \`jsrepo.json\`.
│
└  All done!`}
/>
<p>
	Once you have run through the prompts your <CodeSpan>jsrepo.json</CodeSpan> file should look something
	like this:
</p>
<Code
	lang="json"
	code={`{
	"$schema": "https://unpkg.com/jsrepo@${version.current}/schemas/project-config.json",
	"repos": ["github/ieedan/std"],
	"path": "src/blocks",
	"includeTests": false,
	"watermark": true,
	"formatter": "prettier",
	"paths": {
		"*": "./src/blocks"
	}
}`}
/>
<p>
	Now that you've created the <CodeSpan>jsrepo.json</CodeSpan> you can start adding blocks from registries.
</p>
<Snippet command="execute" args={['jsrepo', 'add']} />
<p>
	To update blocks you can run <CodeSpan>update</CodeSpan> this will show a diff for each changed file
	and allow you to choose to accept or reject the changes.
</p>
<Snippet command="execute" args={['jsrepo', 'update']} />
