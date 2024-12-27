<script lang="ts">
	import { Blockquote, CodeSpan, DocHeader, Jsrepo, SubHeading } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import { Snippet } from '$lib/components/ui/snippet';
</script>

<DocHeader
	title="update"
	description="Interactively update your blocks to the latest code in the registry."
/>
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
