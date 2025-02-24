<script lang="ts">
	import { DocHeader, Jsrepo, Link, SubHeading } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import CodeSpan from '$lib/components/site/docs/code-span.svelte';
	import { Snippet } from '$lib/components/ui/snippet';
	import { UseAwait } from '$lib/hooks/use-await.svelte.js';

	let { data } = $props();

	const version = new UseAwait(data.version, '1.0.0');
</script>

<DocHeader title="GitHub" description="How to use GitHub as your jsrepo registry." />
<SubHeading>Branches and Tags</SubHeading>
<p>
	<Jsrepo /> supports <Link target="_blank" href="https://github.com">GitHub</Link> so that you can just
	paste a link to the repo homepage and it will be handled correctly.
</p>
<p>Because of this all of the following paths work:</p>
<Code
	hideLines
	lang="bash"
	code={`https://github.com/ieedan/std # default branch shorthand
https://github.com/ieedan/std/tree/v1.5.0 # tag reference
https://github.com/ieedan/std/tree/next # branch reference`}
/>
<SubHeading>Using Tags for Versioning</SubHeading>
<p>
	Tags can be a great solution to ensuring remote tests and blocks stay on a consistent version.
</p>
<Code
	lang="json"
	code={`{
		"$schema": "https://unpkg.com/jsrepo@${version.current}/schemas/project-config.json",
		// use a specific version tag
		"repos": ["https://github.com/ieedan/std/tree/v1.5.0"],
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
	Tags do not however work like npm packages. Tags are completely mutable meaning a malicious
	registry could publish over a tag with different code.
</p>
<p>This is why it's always important to make sure you trust the owner of the registry.</p>
<SubHeading><CodeSpan class="text-2xl">github</CodeSpan> Shorthand</SubHeading>
<p>
	When referencing <Link target="_blank" href="https://github.com">GitHub</Link> as the provider you
	can use the <CodeSpan>github</CodeSpan> shorthand in place of
	<CodeSpan>https://github.com</CodeSpan>.
</p>
<p>Example:</p>
<Snippet command="execute" args={['jsrepo', 'add', 'github/ieedan/std/utils/math']} />
<p>
	In the <CodeSpan>jsrepo.json</CodeSpan>:
</p>
<Code
	lang="json"
	code={`{
		"$schema": "https://unpkg.com/jsrepo@${version.current}/schemas/project-config.json",
		// use github instead of https://github.com
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
<SubHeading>Rate Limiting</SubHeading>
<p>
	If you are doing a lot of testing with <Jsrepo /> you may eventually get to a point where GitHub "cuts
	you off". At this point GitHub will start to return cached responses when trying to add, update, or
	test blocks.
</p>
<p>
	You can get around this by supplying a PAT with the <CodeSpan>auth</CodeSpan> command.
</p>
<SubHeading>CI / CD</SubHeading>
<p>
	If you are creating your own registry you may want to build the registry on a push to the main
	branch to make sure that the <CodeSpan>jsrepo-manifest.json</CodeSpan> is always up to date with the
	latest changes.
</p>
<p>Workflow to build the manifest and create a pull request:</p>
<Code
	lang="yaml"
	code={`name: build-registry

on:
    push:
        branches:
            - main

permissions:
    contents: write
    pull-requests: write
    id-token: write

jobs:
    build:
        runs-on: ubuntu-latest
        permissions:
            contents: write
            pull-requests: write
        steps:
            - uses: actions/checkout@v4
              with:
                  fetch-depth: 0
            - uses: actions/setup-node@v4
              with:
                  node-version: "20"

            # jsrepo doesn't need any of your 
            # dependencies to be installed to work
            - name: Build jsrepo-manifest.json
              run: npx jsrepo build

            - name: Create pull request with changes
              uses: peter-evans/create-pull-request@v7
              with:
                  title: "chore: update \`jsrepo-manifest.json\`"
                  body: |
                      - Update \`jsrepo-manifest.json\`

                      ---
                      This PR was auto generated
                  branch: build-manifest
                  commit-message: build \`jsrepo-manifest.json\``}
/>
