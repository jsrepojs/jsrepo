<script lang="ts">
	import { CodeSpan, DocHeader, Jsrepo, Link, SubHeading } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import { Snippet } from '$lib/components/ui/snippet';

	let { data } = $props();
</script>

<DocHeader title="Registry Setup" description="Create your own registry to share your code." />
<p>
	To create a registry start by creating a new
	<Link target="_blank" href="https://github.com/new">GitHub</Link>,
	<Link target="_blank" href="https://gitlab.com/projects/new#blank_project">GitLab</Link>, or
	<Link target="_blank" href="https://bitbucket.org">BitBucket</Link> repository.
</p>
<p>
	<Jsrepo /> looks at the directories in your project to determine which blocks to add the the
	<CodeSpan>jsrepo-manifest.json</CodeSpan> file. Because of this you need to follow a specific file
	structure.
</p>
<Code
	hideLines
	hideCopy
	code={`root
├── package.json
├── ...
└── <folder>
    ├── <category>
    │   ├── <block>.(ts|js|tsx|jsx|svelte)
    │   └── <block>
    │       ├── <file>
    │       └── <file>
    └── <category>
`}
/>
<p>You will need to create a folder that will have the block categories (`blocks` above).</p>
<p>Inside this folder you add your categories ex: (utils, components, etc.).</p>
<p>
	Inside your categories folders you add the code for your blocks. You can either add the block code
	as a single file directly inside the category or you can create a folder that contains the files
	for the block.
</p>
<p>
	When adding blocks users will access your blocks by specifying
	<CodeSpan>{`<category>/<name>`}</CodeSpan>.
</p>
<p>When you are done your file structure might look something like this:</p>
<Code
	hideLines
	hideCopy
	code={`root
├── package.json
├── ...
└── blocks
    └── utils
        ├─── print.ts
        └─── math
            ├─── add.ts
            └─── subtract.ts
`}
/>
<p>
	Once you have setup all you files run you'll want to setup a <CodeSpan>build</CodeSpan> script to build
	your blocks into a <CodeSpan>jsrepo-manifest.json</CodeSpan>.
</p>
<p>The easiest way to do this is to use the CLI:</p>
<Snippet command="execute" args={['jsrepo', 'init', '--registry']} />
<Code
	hideLines
	hideCopy
	code={`┌   jsrepo  v1.15.1 
│
◇  Where are your blocks located?
│  ./src
│
◇  Add another blocks directory?
│  No
│
◇  Create a \`jsrepo-build-config.json\` file?
│  Yes
│
◇  Added \`build:registry\` to scripts in package.json
│
◇  Created \`jsrepo-build-config.json\`
│
├  Next Steps ────────────────────────────────────────────────┐
│                                                             │
│  1. Add categories to \`./src\`.                              │
│  2. Run \`npm run build:registry\` to build the registry.    │
│                                                             │
├─────────────────────────────────────────────────────────────┘
│
└  All done!`}
/>
<p>This sets your registry for you based on your answers to the prompts.</p>
<p>Once your done you can execute the build script:</p>
<Snippet command="run" args={['build:registry']} />
<p>
	After running <CodeSpan>build</CodeSpan> the output <CodeSpan>jsrepo-manifest.json</CodeSpan> should
	look something like this.
</p>
<Code
	lang="json"
	code={`[
  {
    "name": "utils", // category name
    "blocks": [ // blocks in the category
	  {
		"name": "print", // name of the block
        "directory": "src/utils", // directory containing the files
        "category": "utils",
        "tests": false, // whether or not the block has tests
        "subdirectory": false, // is the block in a subdirectory of it's category
        "files": [
            "print.ts"
        ],
        "localDependencies": [], // any dependencies to other blocks
        "dependencies": [], // any dependencies 
        "devDependencies": []  // any dependencies 
      },
      {
        "name": "print",
        "directory": "src/utils",
        "category": "utils",
        "tests": false,
        "subdirectory": true,
        "files": [
            "add.ts",
            "subtract.ts"
        ],
        "localDependencies": [
            "utils/print"
        ], 
        "dependencies": [],
        "devDependencies": []
      }
	]
  },
]`}
/>
<p>
	Commit the output <CodeSpan>jsrepo-manifest.json</CodeSpan> to a public repository and you should now
	be able to access your blocks by running:
</p>
<Snippet command="execute" args={['jsrepo', 'add', '--repo', 'github/<owner>/<repo>']} />
<SubHeading>Dependencies</SubHeading>
<p>Your blocks can depend on npm packages as well as other blocks in your project.</p>
<p>
	<span class="font-mono text-sm">blocks/utils/math/add.ts</span>
</p>
<Code
	lang="ts"
	code={`import { print } from "../print"; // another block
import color from "chalk"; // npm package

const add = (a: number, b: number): number => {
  print(\`result is: \${color.cyan(\`\${a + b}\`)}\`)
}`}
/>
<p>If you now add <CodeSpan>utils/math</CodeSpan> you will get the following output:</p>
<Snippet command="execute" args={['jsrepo', 'add', 'utils/math']} />
<Code
	hideLines
	hideCopy
	code={`┌   jsrepo  v${data.version} 
│
◇  Retrieved blocks from github/<owner>/<name>
│
◇  Added github/<owner>/<name>/utils/math
│
◇  Added github/<owner>/<name>/utils/print
│
◇  Would you like to install dependencies?
│  Yes
│
◇  Installed chalk
│
├  Next Steps ────────────────────────────┐
│                                         │
│  Import the blocks from \`src/blocks\`    │
│                                         │
├─────────────────────────────────────────┘
│
└  All done!`}
/>
<SubHeading>Excluding Dependencies</SubHeading>
<p>
	By default in <CodeSpan>*.svelte</CodeSpan> and <CodeSpan>*.vue</CodeSpan> files importing from
	<CodeSpan>'svelte'</CodeSpan> or <CodeSpan>'vue'</CodeSpan> will not result in the respective frameworks
	being added as a dependency.
</p>
<p>
	This is because it's pretty easy to assume anyone adding either of those file types to their
	project will already have Svelte or Vue installed.
</p>
<p>
	However if you are using a <CodeSpan>*.jsx</CodeSpan> based framework we don't assume anything for
	you.
</p>
<p>
	Instead when running the <CodeSpan>build</CodeSpan> command you can provide the
	<CodeSpan>--exclude-deps</CodeSpan> flag:
</p>
<Snippet command="execute" args={['jsrepo', 'build', '--exclude-deps', 'react', 'next']} />
<p>
	By providing that flag it tells <Jsrepo /> to ignore those dependencies and skip adding them to the
	manifest file.
</p>
<div class="flex flex-col gap-3">
	<SubHeading>Examples</SubHeading>
	<ul class="flex flex-col gap-2">
		<li class="list-disc">
			<Link target="_blank" href="https://github.com/ieedan/std">github/ieedan/std</Link>
		</li>
		<li class="list-disc">
			<Link target="_blank" href="https://github.com/ieedan/shadcn-svelte-extras">
				github/ieedan/shadcn-svelte-extras
			</Link>
		</li>
		<li class="list-disc">
			<Link target="_blank" href="https://gitlab.com/ieedan/std">gitlab/ieedan/std</Link>
		</li>
		<li class="list-disc">
			<Link target="_blank" href="https://bitbucket.org/ieedan/std">bitbucket/ieedan/std</Link>
		</li>
		<li class="list-disc">
			<Link target="_blank" href="https://dev.azure.com/ieedan/_git/std">azure/ieedan/std/std</Link>
		</li>
	</ul>
</div>
