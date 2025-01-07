<script lang="ts">
	import { goto } from '$app/navigation';
	import { CodeSpan, DocHeader } from '$lib/components/site/docs';
	import * as Table from '$lib/components/ui/table';

	type Command = {
		name: string;
		description: string;
	};

	const commands: Command[] = [
		{
			name: 'add',
			description: 'Add blocks to your project.'
		},
		{
			name: 'auth',
			description: 'Configure access tokens for private repository access.'
		},
		{
			name: 'build',
			description: 'Build your repository into a jsrepo registry.'
		},
		{
			name: 'exec',
			description: 'Execute a block as a script with arguments.'
		},
		{
			name: 'init',
			description: 'Initialize a registry or project with jsrepo.'
		},
		{
			name: 'test',
			description: 'Test your local blocks against their corresponding remote tests.'
		},
		{
			name: 'update',
			description: 'Interactively update your blocks to the latest code in the registry.'
		}
	];
</script>

<DocHeader title="CLI" description="Documentation for the jsrepo CLI." />
<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Cell>Name</Table.Cell>
			<Table.Cell>Description</Table.Cell>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each commands as { name, description }}
			<Table.Row class="hover:cursor-pointer" onclick={() => goto(`/docs/cli/${name}`)}>
				<Table.Cell>
					<CodeSpan>{name}</CodeSpan>
				</Table.Cell>
				<Table.Cell>{description}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
