<script lang="ts">
	import { DocHeader, Jsrepo, SubHeading } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import CodeSpan from '$lib/components/site/docs/code-span.svelte';
	import { Snippet } from '$lib/components/ui/snippet';
</script>

<DocHeader title="Self Hosted" description="How to self host a jsrepo registry." />
<p>
	<Jsrepo /> enables self hosting your registry on the web. This can allow for more customization of
	exactly how things are served. As well as enabling you to do things like distributing your registry
	on a private network.
</p>
<p>Let's show how you might set this up in a SvelteKit app!</p>
<p>
	In this case we will have our block located under
	<CodeSpan>./src/lib</CodeSpan> where
	<CodeSpan>components</CodeSpan> is the category and
	<CodeSpan>button</CodeSpan> is one of our blocks:
</p>
<Code
	hideLines
	code={`root
├── .svelte-kit
├── src
│	└── lib
│		└── components
│			└── button
├── static
├── .gitignore
├── .npmrc
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts`}
/>
<p>
	We will serve our registry out of the <CodeSpan>./static</CodeSpan> folder (for react this would be
	<CodeSpan>./public</CodeSpan>) so that users can access our blocks by running:
</p>
<Snippet command="execute" args={['jsrepo', 'add', '--repo', 'https://example.com/']} />
<p>
	To do this we need to build the registry using the <CodeSpan>--output-dir</CodeSpan> flag. This flag
	will copy the registry to whatever directory we specify in this case <CodeSpan>./static</CodeSpan
	>:
</p>
<Snippet command="execute" args={['jsrepo', 'build', '--output-dir', './static']} />
<p>
	You can also customize where blocks are served. You just need to tell jsrepo where the
	<CodeSpan>jsrepo-manifest.json</CodeSpan> is.
</p>
<Code
	hideLines
	code={`root
├── ...
├── static
│	├── default
│	│	├── ...
│	│   └── jsrepo-manifest.json
│	└── new-york
│		├── ...
│		└── jsrepo-manifest.json
└──  ...`}
/>
<p>
	Now users can access blocks from either <CodeSpan>https://example.com/default</CodeSpan> or
	<CodeSpan>https://example.com/new-york</CodeSpan>:
</p>
<Snippet command="execute" args={['jsrepo', 'add', '--repo', 'https://example.com/default']} />
<p>You can still add fully qualified blocks but as always the path must be complete:</p>
<Snippet
	command="execute"
	args={['jsrepo', 'add', '--repo', 'https://example.com/default/ui/accordion']}
/>
<SubHeading>Private Registries</SubHeading>
<p>
	You can keep your self-hosted registries private only allowing authenticated users to access
	blocks.
</p>
<p>
	Users can provide a token to the <CodeSpan>auth</CodeSpan> method or during initialization so that
	they can access the registry. This token will be passed using the Authorization header with the Bearer
	scheme.
</p>
