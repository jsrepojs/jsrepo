<script lang="ts">
	import { DocHeader, Jsrepo } from '$lib/components/site/docs';
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
<p>
	You can start hosting your own registry by building the <CodeSpan>jsrepo-manifest.json</CodeSpan> at
	the root of where your blocks are hosted.
</p>
<p>For example in a SvelteKit app:</p>
<Code
	hideLines
	code={`root
├── .svelte-kit
├── src
├── static
│   ├── blocks
│   │   └── ...
│   └── jsrepo-manifest.json
├── .gitignore
├── .npmrc
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts`}
/>
<p>Here we put the blocks directly in the static directory so that you simply access them with:</p>
<Snippet command="execute" args={['jsrepo', 'add', '--repo', 'https://example.com/']} />
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
