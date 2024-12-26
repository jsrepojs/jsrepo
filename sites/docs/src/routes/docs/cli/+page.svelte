<script lang="ts">
	import { Blockquote, CodeSpan, DocHeader, Jsrepo, SubHeading } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import { Snippet } from '$lib/components/ui/snippet';
</script>

<DocHeader title="CLI" description="Add, update, diff, build and test with the jsrepo CLI." />
<SubHeading>init</SubHeading>
<p>
	The <CodeSpan>init</CodeSpan> command helps you initialize a project that will add blocks with <Jsrepo
	/>.
</p>
<Snippet command="execute" args={['jsrepo', 'init']} />
<Code
	hideLines
	hideCopy
	code={`Usage: jsrepo init [options]

Initializes your project with a configuration file.

Options:
  --path <path>            Path to install the blocks from.
  --repos [repos...]       Repository to install the blocks from.
  --no-watermark           Will not add a watermark to each file upon adding it to your project.
  --tests                  Will include tests with the blocks.
  --formatter <formatter>  What formatter to use when adding or updating blocks. (choices: "prettier", "biome")
  -P, --project            Takes you through the steps to initialize a project.
  -R, --registry           Takes you through the steps to initialize a registry.
  --script <name>          The name of the build script. (For Registry setup) (default: "build:registry")
  -y, --yes                Skip confirmation prompt. (default: false)
  --cwd <path>             The current working directory. (default: ".")
  -h, --help               display help for command`}
/>
<SubHeading>add</SubHeading>
<p>
	The <CodeSpan>add</CodeSpan> command helps you add blocks to your project from remote repositories.
</p>
<Snippet command="execute" args={['jsrepo', 'add', '<category>/<name>']} />
<p>or</p>
<Snippet command="execute" args={['jsrepo', 'add', 'github/<owner>/<name>/<category>/<name>']} />
<Code
	hideLines
	hideCopy
	code={`Usage: jsrepo add [options] [blocks...]

Arguments:
  blocks         Names of the blocks you want to add to your project. ex: (utils/math, github/ieedan/std/utils/math)

Options:
  --repo <repo>  Repository to download the blocks from.
  -A, --allow    Allow jsrepo to download code from the provided repo. (default: false)
  -y, --yes      Skip confirmation prompt. (default: false)
  --verbose      Include debug logs. (default: false)
  --cwd <path>   The current working directory. (default: ".")
  -h, --help     display help for command`}
/>
<SubHeading>update</SubHeading>
<p>
	The <CodeSpan>update</CodeSpan> command helps you update blocks already installed in your project.
	When updating the CLI will take you over every changed file and show you a diff so you can what changed
	and decide whether or not to accept the change.
</p>
<Snippet command="execute" args={['jsrepo', 'update', '<category>/<name>']} />
<Code
	hideLines
	hideCopy
	code={`Usage: jsrepo update [options] [blocks...]

Arguments:
  blocks                    Names of the blocks you want to update. ex: (utils/math)

Options:
  --all                     Update all installed components. (default: false)
  -E, --expand              Expands the diff so you see everything. (default: false)
  --max-unchanged <number>  Maximum unchanged lines that will show without being collapsed. (default: 3)
  --repo <repo>             Repository to download the blocks from.
  -A, --allow               Allow jsrepo to download code from the provided repo. (default: false)
  -y, --yes                 Skip confirmation prompt. (default: false)
  --verbose                 Include debug logs. (default: false)
  --cwd <path>              The current working directory. (default: ".")
  -h, --help                display help for command`}
/>
<SubHeading>build</SubHeading>
<p>
	The <CodeSpan>build</CodeSpan> command builds the specified directories into a
	<CodeSpan>jsrepo-manifest.json</CodeSpan> file.
</p>
<Snippet command="execute" args={['jsrepo', 'build']} />
<Code
	hideLines
	hideCopy
	code={`Usage: jsrepo build [options]

Builds the provided --dirs in the project root into a \`jsrepo-manifest.json\` file.

Options:
  --dirs [dirs...]                             The directories containing the blocks.
  --include-blocks [blockNames...]             Include only the blocks with these names.
  --include-categories [categoryNames...]      Include only the categories with these names.
  --exclude-blocks [blockNames...]             Do not include the blocks with these names.
  --exclude-categories [categoryNames...]      Do not include the categories with these names.
  --list-blocks [blockNames...]                List only the blocks with these names.
  --list-categories [categoryNames...]         List only the categories with these names.
  --do-not-list-blocks [blockNames...]         Do not list the blocks with these names.
  --do-not-list-categories [categoryNames...]  Do not list the categories with these names.
  --exclude-deps [deps...]                     Dependencies that should not be added.
  --preview                                    Display a preview of the blocks list.
  --no-output                                  Do not output a \`jsrepo-manifest.json\` file.
  --verbose                                    Include debug logs. (default: false)
  --cwd <path>                                 The current working directory. (default: ".")
  -h, --help                                   display help for command`}
/>
<SubHeading>exec</SubHeading>
<p>
	The <CodeSpan>exec</CodeSpan> command allows you to execute a block with arguments.
</p>
<Snippet command="execute" args={['jsrepo', 'exec', '<category>/<name>']} />
<p>or</p>
<Snippet command="execute" args={['jsrepo', 'exec', 'github/<owner>/<name>/<category>/<name>']} />
<Code
	hideLines
	hideCopy
	code={`Usage: jsrepo exec|x [options] [script]

Arguments:
  script         Name of the script you want to execute. ex: (general/hello, github/ieedan/std/general/hello)

Options:
  --repo <repo>  Repository to download and run the script from.
  -A, --allow    Allow jsrepo to download code from the provided repo. (default: false)
  --cwd <path>   The current working directory. (default: ".")        
  -h, --help     display help for command`}
/>
<Blockquote variant="primary">
	For a subdirectory based block <CodeSpan>exec</CodeSpan> will attempt to execute an index file in the
	directory.
</Blockquote>
<SubHeading>test</SubHeading>
<p>
	The <CodeSpan>test</CodeSpan> command allows you to run remote tests on your local code from the CLI.
</p>
<p>This ensures any changes to your code haven't caused any of the original tests to fail.</p>
<Snippet command="execute" args={['jsrepo', 'test']} />
<Code
	hideLines
	hideCopy
	code={`Usage: jsrepo test [options] [blocks...]

Tests local blocks against most recent remote tests.

Arguments:
  blocks         The blocks you want to test. (default: [])

Options:
  --repo <repo>  Repository to download the blocks from
  -A, --allow    Allow jsrepo to download code from the provided repo. (default: false)
  --debug        Leaves the temp test file around for debugging upon failure. (default: false)
  --verbose      Include debug logs. (default: false)
  --cwd <path>   The current working directory. (default: ".")
  -h, --help     display help for command`}
/>
<SubHeading>diff</SubHeading>
<p>
	The <CodeSpan>diff</CodeSpan> command allows you to check what changes would occur if you were to update
	the block from remote.
</p>
<Snippet command="execute" args={['jsrepo', 'diff']} />
<Code
	hideLines
	hideCopy
	code={`Usage: jsrepo diff [options]

Compares local blocks to the blocks in the provided repository.

Options:
  -E, --expand              Expands the diff so you see everything. (default: false)
  --max-unchanged <number>  Maximum unchanged lines that will show without being collapsed. (default: 3)
  --repo <repo>             Repository to download the blocks from.
  -A, --allow               Allow jsrepo to download code from the provided repo. (default: false)
  --cwd <path>              The current working directory. (default: ".")
  -h, --help                display help for command`}
/>
<SubHeading>auth</SubHeading>
<p>
	The <CodeSpan>auth</CodeSpan> command prompts you to provide a token to be used for access to private
	repositories.
</p>
<Snippet command="execute" args={['jsrepo', 'auth']} />
<Code
	hideLines
	hideCopy
	code={`Usage: jsrepo auth [options]

Provide a token for access to private repositories.

Options:
  --token <token>    The token to use for authenticating to your provider.
  --provider <name>  The provider this token belongs to. (choices: "github")
  --logout           Erase tokens from each provider from storage. (default: false)
  --cwd <path>       The current working directory. (default: ".")
  -h, --help         display help for command`}
/>
