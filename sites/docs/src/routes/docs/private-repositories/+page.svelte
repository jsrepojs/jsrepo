<script lang="ts">
	import {
		Blockquote,
		DocHeader,
		Jsrepo,
		Link,
		SubHeading,
		CodeSpan
	} from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import { Snippet } from '$lib/components/ui/snippet';
	import * as Accordion from '$lib/components/ui/accordion';
	import { UseAwait } from '$lib/hooks/use-await.svelte.js';

	let { data } = $props();

	const version = new UseAwait(data.version, '1.0.0');
</script>

<DocHeader
	title="Private Repositories"
	description="Yes! jsrepo supports private repositories too."
/>
<p>
	Adding blocks from a private repository is as simple as providing <Jsrepo /> with an auth token.
</p>
<Snippet command="execute" args={['jsrepo', 'auth']} />
<Blockquote variant="primary">
	Your auth tokens are stored locally on your computer using
	<Link target="_blank" href="https://www.npmjs.com/package/conf">conf</Link>.
</Blockquote>
<Code
	hideLines
	hideCopy
	code={`┌   jsrepo  v${version.current} 
│
◇  Which provider is this token for?
│  github
│
◇  Paste your token
│  ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪
│
└  All done!`}
/>
<div>
	<SubHeading>FAQ</SubHeading>
	<Accordion.Root type="single">
		<Accordion.Item value="q-1">
			<Accordion.Trigger>What permissions does my token need?</Accordion.Trigger>
			<Accordion.Content>
				<ul class="flex flex-col gap-3">
					<li>
						- <Link target="_blank" href="https://github.com/settings/personal-access-tokens/new">
							GitHub
						</Link> - Create a fine grained PAT with access to the repositories you are using and make
						sure to change the access for <CodeSpan>Contents</CodeSpan> under
						<CodeSpan>Repository permissions</CodeSpan> to
						<CodeSpan>Read-only</CodeSpan>.
					</li>
					<li>
						- <Link
							target="_blank"
							href="https://gitlab.com/-/user_settings/personal_access_tokens"
						>
							GitLab
						</Link> - Create an access token with <CodeSpan>read_api</CodeSpan> and
						<CodeSpan>read_repository</CodeSpan>.
					</li>
					<li>
						- <Link target="_blank" href="https://bitbucket.org">BitBucket</Link> - Create an access
						token with <CodeSpan>Read</CodeSpan> for
						<CodeSpan>Repositories</CodeSpan>.
					</li>
				</ul>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</div>
