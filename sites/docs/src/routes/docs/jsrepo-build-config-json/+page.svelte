<script lang="ts">
	import { CodeSpan, DocHeader, SubHeading } from '$lib/components/site/docs';
	import { Code } from '$lib/components/ui/code';
	import { Snippet } from '$lib/components/ui/snippet';
	import { UseAwait } from '$lib/hooks/use-await.svelte.js';

	let { data } = $props();

	const version = new UseAwait(data.version, '1.0.0');
</script>

<DocHeader title="jsrepo-build-config.json" description="Configuration for your registry." />
<p>
	<CodeSpan>jsrepo-build-config.json</CodeSpan> holds the configuration for your registry.
</p>
<p>
	You can create a <CodeSpan>jsrepo-build-config.json</CodeSpan> by running the init command with the
	<CodeSpan>--registry</CodeSpan> flag:
</p>
<Snippet command="execute" args={['jsrepo', 'init', '--registry']} />

<SubHeading>$schema</SubHeading>
<p>
	<CodeSpan>$schema</CodeSpan> is tracked with the cli so you can use a specific version using <CodeSpan
		>unpkg</CodeSpan
	>:
</p>
<Code
	lang="json"
	code={`{
	"$schema": "https://unpkg.com/jsrepo@${version.current}/schemas/registry-config.json"
}`}
/>

<SubHeading>allowSubdirectories</SubHeading>
<p>
	<CodeSpan>allowSubdirectories</CodeSpan> allows subdirectories to be built.
</p>
<Code
	lang="json"
	code={`{
	"allowSubdirectories": false
}`}
/>

<SubHeading>configFiles</SubHeading>
<p>
	<CodeSpan>configFiles</CodeSpan> allows you to specify files that the user may need in their project
	for the registry to function properly.
</p>
<Code
	lang="json"
	code={`{
	"configFiles": [
		{
			"name": "app.css",
			"path": "./src/app.css",
			"expectedPath": "./src/app.css",
			"optional": false
		}
	]
}`}
/>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">expectedPath</CodeSpan>
	<p>The path where you expect users to have this file (used as a default in prompts).</p>
</div>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">name</CodeSpan>
	<p>The name as it will be displayed in prompts to the user.</p>
</div>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">optional</CodeSpan>
	<p>When true users will be prompted to ask whether or not they want to add the config file.</p>
</div>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">path</CodeSpan>
	<p>The path of the file in your registry.</p>
</div>

<SubHeading>dirs</SubHeading>
<p>
	<CodeSpan>dirs</CodeSpan> is a list of the directories that contain your block categories.
</p>
<Code
	lang="json"
	code={`{
	"dirs": [
		"./src",
		"./blocks"
	]
}`}
/>

<SubHeading>doNotListBlocks</SubHeading>
<p>
	<CodeSpan>doNotListBlocks</CodeSpan> is a list of block names that shouldn't be listed when the user
	runs the <CodeSpan>add</CodeSpan> command.
</p>
<Code
	lang="json"
	code={`{
	"doNotListBlocks": [
		"utils"
	]
}`}
/>

<SubHeading>doNotListCategories</SubHeading>
<p>
	<CodeSpan>doNotListCategories</CodeSpan> is a list of category names that shouldn't be listed when
	the user runs the <CodeSpan>add</CodeSpan> command.
</p>
<Code
	lang="json"
	code={`{
	"doNotListCategories": [
		"utils"
	]
}`}
/>

<SubHeading>excludeBlocks</SubHeading>
<p>
	<CodeSpan>excludeBlocks</CodeSpan> allows you to prevent the specified blocks from being included in
	the manifest.
</p>
<Code
	lang="json"
	code={`{
	"excludeBlocks": [
		"domain"
	]
}`}
/>

<SubHeading>excludeCategories</SubHeading>
<p>
	<CodeSpan>excludeCategories</CodeSpan> allows you to prevent the specified categories from being included
	in the manifest.
</p>
<Code
	lang="json"
	code={`{
	"excludeCategories": [
		"INTERNAL"
	]
}`}
/>

<SubHeading>excludeDeps</SubHeading>
<p>
	<CodeSpan>excludeDeps</CodeSpan> allows you to prevent specified remote dependencies from being installed
	when the user adds/updates blocks. This is useful for framework specific API's like React or Svelte.
</p>
<Code
	lang="json"
	code={`{
	"excludeDeps": [
		"svelte",
		"react",
		"vue"
	]
}`}
/>

<SubHeading>includeBlocks</SubHeading>
<p>
	<CodeSpan>includeBlocks</CodeSpan> allows you to only include specified blocks in the final manifest
	file. Keep in mind that if these blocks are referenced by other blocks that are included then your
	build will break.
</p>
<Code
	lang="json"
	code={`{
	"includeBlocks": [
		"ui",
		"hooks"
	]
}`}
/>

<SubHeading>includeCategories</SubHeading>
<p>
	<CodeSpan>includeCategories</CodeSpan> allows you to only include specified categories in the final
	manifest file. Keep in mind that if these categories are referenced by other categories that are included
	then your build will break.
</p>
<Code
	lang="json"
	code={`{
	"includeCategories": [
		"components",
		"utils"
	]
}`}
/>

<SubHeading>listBlocks</SubHeading>
<p>
	<CodeSpan>listBlocks</CodeSpan> is a list of block names that should be listed when the user runs the
	<CodeSpan>add</CodeSpan> command.
</p>
<Code
	lang="json"
	code={`{
	"listBlocks": [
		"utils"
	]
}`}
/>

<SubHeading>listCategories</SubHeading>
<p>
	<CodeSpan>listCategories</CodeSpan> is a list of category names that should be listed when the user
	runs the <CodeSpan>add</CodeSpan> command.
</p>
<Code
	lang="json"
	code={`{
	"listCategories": [
		"utils"
	]
}`}
/>

<SubHeading>meta</SubHeading>
<p>
	<CodeSpan>meta</CodeSpan> allows you to provide optional information about the registry that can be
	displayed to users for better documentation.
</p>
<Code
	lang="json"
	code={`{
	"meta": {
	  "authors": ["Aidan Bleser"],
	  "bugs": "https://github.com/ieedan/std/issues",
	  "description": "Fully tested and documented TypeScript utilities brokered by jsrepo.",
	  "homepage": "https://ieedan.github.io/std/",
	  "repository": "https://github.com/ieedan/std",
	  "tags": ["typescript", "std"]
	} 
}`}
/>

<SubHeading>outputDir</SubHeading>
<p>
	<CodeSpan>outputDir</CodeSpan> is an optional key that allows you to copy the resulting
	<CodeSpan>jsrepo-manifest.json</CodeSpan> and any required files to a custom directory.
</p>
<p>
	This is useful if you want to host the registry in a different location from where the code
	actually lives. (This should NOT be used when hosting your registry from a git repository)
</p>
<Code
	lang="json"
	code={`{
	  "outputDir": "./static/new-york"
}`}
/>

<SubHeading>peerDependencies</SubHeading>
<p>
	<CodeSpan>peerDependencies</CodeSpan> allow you to warn users when they are missing dependencies that
	are required or are using dependency versions that are incompatible.
</p>
<Code
	lang="json"
	code={`{
	"peerDependencies": {
	  "svelte": {
		"version": "5.x.x",
		"message": "Svelte 5 is the only supported version for this registry see: https://github.com/ieedan/jsrepo"
	  },
	  "tailwindcss": "3.x.x"
	}
}`}
/>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">message</CodeSpan>
	<p>A message displayed to users when installing with an incompatible peer dependency.</p>
</div>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">version</CodeSpan>
	<p>The version or version range that is supported by your registry.</p>
</div>

<SubHeading>preview</SubHeading>
<p>
	<CodeSpan>preview</CodeSpan> displays a preview of the blocks list.
</p>
<Code
	lang="json"
	code={`{
	  "preview": false
}`}
/>

<SubHeading>rules</SubHeading>
<p>
	<CodeSpan>rules</CodeSpan> allows you to configure the rules when checking the manifest file after
	build.
</p>
<p>Below are the default settings for each rule.</p>
<Code
	lang="json"
	code={`{
	"rules": {
		"no-category-index-file-dependency": "warn",
		"no-unpinned-dependency": "warn",
		"require-local-dependency-exists": "error",
		"max-local-dependencies": ["warn", 10],
		"no-cir-dependency": "error",
		"no-unused-block": "warn",
		"no-framework-dependency": "warn"
	}
}`}
/>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">no-category-index-file-dependency</CodeSpan>
	<p>Disallow depending on the index file of a category.</p>
</div>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">no-unpinned-dependency</CodeSpan>
	<p>Require all dependencies to have a pinned version.</p>
</div>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">require-local-dependency-exists</CodeSpan>
	<p>Require all local dependencies to exist.</p>
</div>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">max-local-dependencies</CodeSpan>
	<p>Enforces a limit on the amount of local dependencies a block can have.</p>
</div>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">no-circular-dependency</CodeSpan>
	<p>Disallow circular dependencies.</p>
</div>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">no-unused-block</CodeSpan>
	<p>Disallow unused blocks. (Not listed and not a dependency of another block)</p>
</div>
<div class="flex flex-col gap-2">
	<CodeSpan class="w-fit">no-framework-dependency</CodeSpan>
	<p>Disallow frameworks (Svelte, Vue, React) as dependencies.</p>
</div>
