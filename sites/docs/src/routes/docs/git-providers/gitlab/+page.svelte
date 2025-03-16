<script lang="ts">
	import { DocHeader, Jsrepo, Link, SubHeading } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import CodeSpan from '$lib/components/site/docs/code-span.svelte';
	import { Snippet } from '$lib/components/ui/snippet';
	import { UseAwait } from '$lib/hooks/use-await.svelte.js';

	let { data } = $props();

	const version = new UseAwait(data.version, '1.0.0');
</script>

<DocHeader title="GitLab" description="How to use GitLab as your jsrepo registry." />
<SubHeading>Branches and Tags</SubHeading>
<p>
	<Jsrepo /> supports <Link target="_blank" href="https://gitlab.com">GitLab</Link> so that you can just
	paste a link to the repo homepage and it will be handled correctly.
</p>
<p>Because of this all of the following paths work:</p>
<Code
	hideLines
	lang="bash"
	code={`https://gitlab.com/ieedan/std # default branch shorthand
https://gitlab.com/ieedan/std/-/tree/v1.5.0 # tag reference
https://gitlab.com/ieedan/std/-/tree/next # branch reference`}
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
		"repos": ["https://gitlab.com/ieedan/std/-/tree/v1.5.0"],
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
<SubHeading><CodeSpan class="text-2xl">gitlab</CodeSpan> Shorthand</SubHeading>
<p>
	When referencing <Link target="_blank" href="https://gitlab.com">GitLab</Link> as the provider you
	can use the <CodeSpan>gitlab</CodeSpan> shorthand in place of
	<CodeSpan>https://gitlab.com</CodeSpan>.
</p>
<p>Example:</p>
<Snippet command="execute" args={['jsrepo', 'add', 'gitlab/ieedan/std/utils/math']} />
<p>
	In the <CodeSpan>jsrepo.json</CodeSpan>:
</p>
<Code
	lang="json"
	code={`{
		"$schema": "https://unpkg.com/jsrepo@${version.current}/schemas/project-config.json",
		// use gitlab instead of https://gitlab.com
		"repos": ["gitlab/ieedan/std"],
		"path": "src/blocks",
		"includeTests": false,
		"watermark": true,
		"formatter": "prettier",
		"paths": {
			"*": "./src/blocks"
		}
}`}
/>
<SubHeading>Self hosted GitLab</SubHeading>
<p>Some companies prefer to host their own GitLab instance so we allow that too!</p>
<p>
	You can use the <CodeSpan>gitlab:</CodeSpan> prefix followed by your custom domain to point to your
	self hosted instance:
</p>
<Code lang="diff" hideLines hideCopy code={'gitlab:https://example.com/ieedan/std'} />
<p>
	Now requests will be made to <CodeSpan>https://example.com</CodeSpan> with the owner
	<CodeSpan>ieedan</CodeSpan> and the repository name <CodeSpan>std</CodeSpan>.
</p>
