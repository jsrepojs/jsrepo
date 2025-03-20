<script lang="ts">
	import { DocHeader, Jsrepo, Link, SubHeading, CodeSpan } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
</script>

<DocHeader title="Dynamic Registries" description="The final frontier of reusable code." />
<p>
	If you have ever used shadcn to install components from
	<Link href="https://v0.dev" target="_blank">v0</Link> you are familiar with dynamic registries. They
	allow the server to serve different files to the CLI based on the route that was requested.
</p>
<p>
	This is useful if your product generates code that you want to distribute through the <Jsrepo /> CLI.
</p>
<p>
	To understand how to effectively create a dynamic registry in <Jsrepo /> you need to have a deeper
	understanding of the way that the manifest file works.
</p>
<SubHeading>How jsrepo locates files</SubHeading>
<p>
	The <CodeSpan>jsrepo-manifest.json</CodeSpan> includes all the blocks in your registry and their locations
	relative to the manifest file.
</p>
<p>
	This means that you need to ensure that the files needed for your registry are served from the
	path that is inferred from the <CodeSpan>jsrepo-manifest.json</CodeSpan>.
</p>
<p>For example take this manifest entry for a button component:</p>
<Code
	lang="typescript"
	code={`{
    name: 'ui',
    blocks: [
        {
            name: 'button',
            directory: 'src/ui/button',
            category: 'ui',
            tests: false,
            subdirectory: true,
            list: true,
            files: ['button.svelte', 'index.ts'],
            localDependencies: ['utils/utils'],
            dependencies: [],
            devDependencies: [
                '@lucide/svelte@^0.475.0',
                'bits-ui@1.3.2',
                'tailwind-variants@^0.3.1'
            ],
            _imports_: {
                '$lib/utils/utils.js': '{{utils/utils}}.js'
            }
        }
    ]
},`}
/>
<p>
	The directory that the files for button live in is <CodeSpan>src/ui/button</CodeSpan> because the
	<CodeSpan>directory</CodeSpan> prop is set to <CodeSpan>src/ui/button</CodeSpan>.
</p>
<p>
	Because of this <Jsrepo /> expects the files <CodeSpan>button.svelte</CodeSpan> and
	<CodeSpan>index.ts</CodeSpan> to exist at
	<CodeSpan>src/ui/button/button.svelte</CodeSpan> and
	<CodeSpan>src/ui/button/index.ts</CodeSpan> respectively.
</p>
<SubHeading>Dependencies</SubHeading>
<p>
	Any remote or local dependencies that need to be resolved should also be added to each block. In
	the case of the button component shown above. It has 3 remote dependencies and 1 local dependency.
</p>
<p>
	Remote dependencies exist under <CodeSpan>dependencies</CodeSpan>
	or <CodeSpan>devDependencies</CodeSpan> and give the name of the package optionally followed by the
	version.
</p>
<p>
	Local dependencies exist under <CodeSpan>localDependencies</CodeSpan> and reference other blocks in
	the registry and they are listed by <CodeSpan>{`<category>/<block>`}</CodeSpan>. In this case
	<CodeSpan>utils/utils</CodeSpan> is referring to the utils block in the utils category.
</p>
<p>
	Local dependencies should also come with corresponding mappings in <CodeSpan>_imports_</CodeSpan>.
	The <CodeSpan>_imports_</CodeSpan> key maps literal import statements to a template that is replaced
	before adding blocks to your project. This allows users to put blocks anywhere in their project without
	breaking their code.
</p>
<p>
	If you want dynamic blocks to depend on other blocks you will need to be able to add keys to
	<CodeSpan>_imports_</CodeSpan> to prevent breaking their code. Heres an example of how you might resolve
	the utils import from the button component above:
</p>
<Code
	lang="typescript"
	code={`// here we just replace everything except for the extension
// so it turns into {{utils/utils}}.js
import { cn } from '$lib/utils/utils.js';

// turns into {{utils/utils}}
import { cn } from '$lib/utils/utils';

// turns into {{utils/utils}}
import { cn } from '../utils/utils';

// if utils was a subdirectory with a file index.js
// turns into {{utils/utils}}/index.js
import { cn } from '../utils/utils/index.js';`}
/>
<p>
	Essentially the path to the local dependency is insignificant but the file or extension after it
	must be included.
</p>
<SubHeading>Type Definitions</SubHeading>
<p>Type definitions for the manifest can be acquired via the JS API:</p>
<Code lang="typescript" code={`import type { Manifest } from 'jsrepo';`} />
<SubHeading>Conclusion</SubHeading>
<p>
	With all of this considered you can pretty easily create a dynamic jsrepo registry in a few
	minutes and start distributing components through the jsrepo CLI.
</p>
<div class="flex flex-col gap-3">
	<SubHeading>Examples</SubHeading>
	<ul class="flex flex-col gap-2">
		<li class="list-disc">
			<Link target="_blank" href="https://github.com/ieedan/jsrepo-dynamic"
				>github/ieedan/jsrepo-dynamic</Link
			>
		</li>
	</ul>
</div>
