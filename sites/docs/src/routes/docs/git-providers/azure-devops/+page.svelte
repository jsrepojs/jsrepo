<script lang="ts">
	import { DocHeader, Link, SubHeading } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import { UseAwait } from '$lib/hooks/use-await.svelte.js';

	let { data } = $props();

	const version = new UseAwait(data.version, '1.0.0');
</script>

<DocHeader title="AzureDevops" description="How to use AzureDevops as your jsrepo registry." />
<SubHeading>Branches and Tags</SubHeading>
<p>
	Because the <Link target="_blank" href="https://bitbucket.org">AzureDevops</Link> URL structure doesn't
	include enough information to fetch raw files we have to use a custom structure so copy pasting the
	URL from the homepage like you can for other providers won't just work.
</p>
<p>Instead you need to follow the following format:</p>
<Code hideLines lang="diff" code={`azure/<organization>/<project>/<repo>/(tags|heads)/<ref>`} />
<Code
	hideLines
	lang="bash"
	code={`azure/ieedan/std/std # default branch shorthand
azure/ieedan/std/std/tags/v1.5.0 # tag reference
azure/ieedan/std/std/heads/next # branch reference`}
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
		"repos": ["azure/ieedan/std/std/tags/v1.5.0"],
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
