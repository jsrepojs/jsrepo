import pc from 'picocolors';
import type { z } from 'zod';
import type { RegistryItemType } from './config';

export type CLIError =
	| JsrepoError
	| NoPackageJsonFoundError
	| ConfigNotFoundError
	| InvalidRegistryError
	| RegistryItemNotFoundError
	| ManifestFetchError
	| RegistryItemFetchError
	| RegistryFileFetchError
	| RegistryNotProvidedError
	| MultipleRegistriesError
	| AlreadyInitializedError
	| FailedToLoadConfigError
	| ConfigNotFoundError
	| InvalidOptionsError
	| NoRegistriesError
	| NoOutputsError
	| NoPathProvidedError
	| NoListedItemsError
	| DuplicateItemNameError
	| SelfReferenceError
	| NoFilesError
	| IllegalBlockNameError
	| InvalidRegistryDependencyError
	| DuplicateFileReferenceError
	| FileNotFoundError
	| FileNotResolvedError
	| ImportedFileNotResolvedError
	| InvalidPluginError
	| InvalidKeyTypeError
	| ConfigObjectNotFoundError
	| CouldNotFindJsrepoImportError
	| ZodError
	| InvalidJSONError
	| NoProviderFoundError
	| MissingPeerDependencyError
	| InvalidRegistryNameError
	| InvalidRegistryVersionError
	| Unreachable;

export class JsrepoError extends Error {
	private readonly suggestion: string;
	private readonly docsLink?: string;
	constructor(
		message: string,
		options: {
			suggestion: string;
			docsLink?: string;
		}
	) {
		super(message);

		this.suggestion = options.suggestion;
		this.docsLink = options.docsLink;
	}

	toString() {
		// TODO: look into formatting this better
		return `${this.message} ${this.suggestion}${this.docsLink ? `\n\nSee: ${this.docsLink}` : ''}`;
	}
}

export class NoPackageJsonFoundError extends JsrepoError {
	constructor() {
		super('No package.json found.', {
			suggestion:
				'Please run create a package.json first before initializing a jsrepo project.',
		});
	}
}

export class InvalidRegistryError extends JsrepoError {
	constructor(registry: string) {
		super(
			`Invalid registry: ${pc.bold(registry)} A provider for this registry was not found.`,
			{
				suggestion: 'Maybe you need to add a provider for this registry?',
				docsLink: 'See: https://v3.jsrepo.dev/docs/providers',
			}
		);
	}
}

export class RegistryItemNotFoundError extends JsrepoError {
	constructor(itemName: string, registry?: string) {
		super(
			`${pc.bold(itemName)} not found in ${pc.bold(registry ? `${registry}` : 'any registry')}.`,
			{
				suggestion: registry
					? `Run ${pc.bold(`\`jsrepo add --registry ${registry}\``)} to list all items in this registry`
					: `Run ${pc.bold(`jsrepo add`)} to list all available registry items.`,
			}
		);
	}
}

export class ProviderFetchError extends JsrepoError {
	readonly resourcePath: string;
	constructor(message: string, resourcePath: string) {
		super(`Error fetching ${resourcePath}: ${message}`, {
			suggestion: 'Please try again.',
		});
		this.resourcePath = resourcePath;
	}
}

export class ManifestFetchError extends JsrepoError {
	constructor(error: unknown) {
		super(
			error instanceof ProviderFetchError
				? `Error fetching manifest file from ${pc.bold(error.resourcePath)}: ${error.message}`
				: `Error fetching manifest file: ${error instanceof Error ? error.message : String(error)}`,
			{
				suggestion: 'Please try again.',
			}
		);
	}
}

export class RegistryItemFetchError extends JsrepoError {
	constructor(error: unknown, options: { registry: string; item: string }) {
		super(
			error instanceof ProviderFetchError
				? `Error fetching ${pc.bold(`${options.registry}/${options.item}`)} from ${pc.bold(
						error.resourcePath
					)}: ${error.message}`
				: `Error fetching ${options.registry}/${options.item}: ${
						error instanceof Error ? error.message : String(error)
					}`,
			{
				suggestion: 'Please try again.',
			}
		);
	}
}

export class RegistryFileFetchError extends JsrepoError {
	constructor(
		message: string,
		options: { registry: string; item: string; resourcePath: string | undefined }
	) {
		super(
			`Error fetching ${pc.bold(`${options.registry}/${options.item}`)}${
				options.resourcePath ? ` from ${pc.bold(options.resourcePath)}` : ''
			}: ${message}`,
			{
				suggestion: 'Please try again.',
			}
		);
	}
}

export class RegistryNotProvidedError extends JsrepoError {
	constructor() {
		super('No registry was provided.', {
			suggestion:
				'Fully qualify blocks ex: (github/ieedan/std/math) or supply them in your config with the `registries` key.',
		});
	}
}

export class MultipleRegistriesError extends JsrepoError {
	constructor(itemName: string, registries: string[]) {
		super(
			`${registries
				.map((r, i) => `${i === registries.length - 1 ? 'and ' : ''}${r}`)
				.join(', ')} contain ${pc.bold(itemName)}.`,
			{
				suggestion: `You will have to be more specific by providing the registry url like: ${pc.bold(
					`\`${registries[0]}/${itemName}\``
				)}.`,
			}
		);
	}
}

export class AlreadyInitializedError extends JsrepoError {
	constructor() {
		super('Config already initialized.', {
			suggestion: `To configure a new registry run ${pc.bold(`\`jsrepo init <registry>\``)}.`,
		});
	}
}

export class FailedToLoadConfigError extends JsrepoError {
	constructor(cause: unknown) {
		super(`Failed to load config: ${cause instanceof Error ? cause.message : String(cause)}`, {
			suggestion: 'Please try again.',
		});
	}
}

export class ConfigNotFoundError extends JsrepoError {
	constructor(path: string) {
		super(`Config not found at ${pc.bold(path)}.`, {
			suggestion: 'Please run `jsrepo init` to create a config file.',
			docsLink: 'https://v3.jsrepo.dev/docs/jsrepo-config',
		});
	}
}

export class InvalidOptionsError extends JsrepoError {
	constructor(error: z.ZodError) {
		super(
			`Invalid options: ${error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
			{
				suggestion: 'Please check the options and try again.',
			}
		);
	}
}

export class NoRegistriesError extends JsrepoError {
	constructor() {
		super('No registries were found in the config.', {
			suggestion: 'Please define at least one registry using the `registry` key.',
		});
	}
}

export class NoPathProvidedError extends JsrepoError {
	constructor({ item, type }: { item: string; type: string }) {
		super(`No path was provided for ${pc.bold(item)} of type ${pc.bold(type)}.`, {
			suggestion: 'Please configure a path with the `paths` key.',
			docsLink: 'https://v3.jsrepo.dev/docs/jsrepo-config#paths',
		});
	}
}

export class BuildError extends JsrepoError {
	readonly registryName: string;
	constructor(
		message: string,
		options: { registryName: string; suggestion: string; docsLink?: string }
	) {
		super(message, {
			suggestion: options.suggestion,
			docsLink: options.docsLink,
		});
		this.registryName = options.registryName;
	}
}

export class ModuleNotFoundError extends JsrepoError {
	constructor(mod: string, { fileName }: { fileName: string }) {
		super(`Module referenced by ${pc.bold(fileName)}: ${pc.bold(mod)} not found.`, {
			suggestion: 'Please ensure the module exists.',
		});
	}
}

export class NoOutputsError extends BuildError {
	constructor({ registryName }: { registryName: string }) {
		super(`No outputs were defined in the registry ${pc.bold(registryName)}.`, {
			registryName,
			suggestion: 'Please define at least one output using the `registry.outputs` key.',
			docsLink: 'https://v3.jsrepo.dev/docs/outputs',
		});
	}
}

export class NoListedItemsError extends BuildError {
	constructor({ registryName }: { registryName: string }) {
		super(`No items were listed in the registry ${pc.bold(registryName)}.`, {
			registryName,
			suggestion: 'Please list at least one item using the `items` key.',
		});
	}
}

export class DuplicateItemNameError extends BuildError {
	constructor({ name, registryName }: { name: string; registryName: string }) {
		super(`Duplicate item name: ${pc.bold(name)}.`, {
			registryName,
			suggestion: 'Please ensure each item has a unique name.',
		});
	}
}

export class SelfReferenceError extends BuildError {
	constructor({ name, registryName }: { name: string; registryName: string }) {
		super(`Self reference: ${pc.bold(name)}.`, {
			registryName,
			suggestion: 'Please ensure each item does not reference itself.',
		});
	}
}

export class NoFilesError extends BuildError {
	constructor({ name, registryName }: { name: string; registryName: string }) {
		super(`No files were listed in the item ${pc.bold(name)}.`, {
			registryName,
			suggestion: 'Please list at least one file using the `files` key.',
		});
	}
}

export class IllegalBlockNameError extends BuildError {
	constructor({ name, registryName }: { name: string; registryName: string }) {
		super(`Illegal block name: ${pc.bold(name)}.`, {
			registryName,
			suggestion: 'Please ensure the block name is not the same as the manifest file name.',
		});
	}
}

export class InvalidRegistryDependencyError extends BuildError {
	constructor({
		dependency,
		item,
		registryName,
	}: { dependency: string; item: string; registryName: string }) {
		super(`Invalid registry dependency: ${pc.bold(dependency)} for item ${pc.bold(item)}.`, {
			registryName,
			suggestion: 'Please ensure the dependency is a valid item in the registry.',
		});
	}
}

export class InvalidDependencyError extends BuildError {
	constructor({
		dependency,
		registryName,
		itemName,
	}: {
		dependency: string;
		registryName: string;
		itemName: string;
	}) {
		super(`Invalid dependency: ${pc.bold(dependency)} for ${pc.bold(itemName)}.`, {
			registryName,
			suggestion: 'Please ensure the dependency is a valid npm package name.',
		});
	}
}

export class DuplicateFileReferenceError extends BuildError {
	constructor({
		path,
		parent,
		duplicateParent,
		registryName,
	}: {
		path: string;
		parent: { name: string; type: RegistryItemType };
		duplicateParent: { name: string; type: RegistryItemType };
		registryName: string;
	}) {
		super(
			`Duplicate file reference: ${pc.bold(path)} is in both ${pc.bold(
				`${parent.type}/${parent.name}`
			)} and ${pc.bold(`${duplicateParent.type}/${duplicateParent.name}`)}.`,
			{
				registryName,
				suggestion: 'Please ensure the file is not referenced multiple times.',
			}
		);
	}
}

export class FileNotFoundError extends BuildError {
	constructor({
		path,
		parent,
		registryName,
	}: {
		path: string;
		parent: { name: string; type: RegistryItemType };
		registryName: string;
	}) {
		super(
			`File not found: ${pc.bold(path)} in ${pc.bold(parent.name)} of type ${pc.bold(parent.type)}.`,
			{
				registryName,
				suggestion: 'Please ensure the file exists.',
			}
		);
	}
}

export class FileNotResolvedError extends BuildError {
	constructor({
		file,
		item,
		registryName,
	}: { file: string; item: string; registryName: string }) {
		super(`File not resolved: ${pc.bold(file)} in item ${pc.bold(item)}.`, {
			registryName,
			suggestion: 'Please ensure the file is resolved.',
		});
	}
}

export class ImportedFileNotResolvedError extends BuildError {
	constructor({
		referencedFile,
		fileName,
		item,
		registryName,
	}: {
		referencedFile: string;
		fileName: string;
		item: string;
		registryName: string;
	}) {
		super(
			`Imported file not resolved: ${pc.bold(referencedFile)} in ${pc.bold(fileName)} of item ${pc.bold(item)}.`,
			{
				registryName,
				suggestion: 'Make sure the file exists and is part of the registry.',
			}
		);
	}
}

export class InvalidPluginError extends JsrepoError {
	constructor(plugin: string) {
		super(`Invalid plugin name: ${pc.bold(plugin)} is not a valid npm package name.`, {
			suggestion: 'Double check the plugin name and try again.',
		});
	}
}

export class InvalidKeyTypeError extends JsrepoError {
	constructor({ key, type }: { key: string; type: 'object' | 'array' }) {
		super(`The ${pc.bold(key)} key in your config must be an ${pc.bold(type)}.`, {
			suggestion: 'Please check your config and try again.',
		});
	}
}

export class ConfigObjectNotFoundError extends JsrepoError {
	constructor() {
		super("We couldn't locate the config object in your config.", {
			suggestion: 'Please check your config and try again.',
		});
	}
}

export class CouldNotFindJsrepoImportError extends JsrepoError {
	constructor() {
		super("We couldn't find the jsrepo import in your config.", {
			suggestion: 'Please check your config and try again.',
		});
	}
}

export class ZodError extends JsrepoError {
	readonly zodError: z.ZodError;
	constructor(error: z.ZodError) {
		super(`Zod error: ${error.message}`, {
			suggestion: 'Check the input schema and try again.',
		});
		this.zodError = error;
	}
}

export class InvalidJSONError extends JsrepoError {
	constructor(error: unknown) {
		super(
			`Invalid JSON: ${error instanceof Error ? (error.stack ?? error.message) : `${error}`}`,
			{
				suggestion: 'Check the input JSON and try again.',
			}
		);
	}
}

export class NoProviderFoundError extends JsrepoError {
	constructor(provider: string) {
		super(
			`No provider found for ${pc.bold(provider)}. Maybe you need to add it to your config?`,
			{
				suggestion: 'Please check the provider name and try again.',
			}
		);
	}
}

export class NoItemsToUpdateError extends JsrepoError {
	constructor() {
		super("We couldn't find any items to update.", {
			suggestion:
				'Add items to your project using `jsrepo add` and then run `jsrepo update` to update them.',
		});
	}
}

export class MissingPeerDependencyError extends JsrepoError {
	constructor(packageName: string, feature: string) {
		super(`${pc.bold(packageName)} is required for ${feature} to work.`, {
			suggestion: `Please install it.`,
		});
	}
}

export class InvalidRegistryNameError extends JsrepoError {
	constructor(registryName: string) {
		super(
			`Invalid registry name: ${pc.bold(
				registryName
			)} is not a valid name. The name should be provided as ${pc.bold(`\`@<scope>/<registry>\``)}.`,
			{
				suggestion: 'Please check the registry name and try again.',
			}
		);
	}
}

export class InvalidRegistryVersionError extends JsrepoError {
	constructor(registryVersion: string | undefined, registryName: string) {
		if (registryVersion === undefined) {
			super(`No version was provided for ${pc.bold(registryName)}.`, {
				suggestion: `Please provide a version using the ${pc.bold(`\`version\``)} key.`,
			});
		} else {
			super(
				`Invalid version for ${pc.bold(registryName)}: ${pc.bold(
					registryVersion
				)} is not a valid version. The version should be provided as ${pc.bold(
					`\`<major>.<minor>.<patch>\``
				)}.`,
				{
					suggestion: 'Please check the registry version and try again.',
				}
			);
		}
	}
}

/**
 * This error is thrown when a code path should be unreachable.
 */
export class Unreachable extends JsrepoError {
	constructor() {
		super('This code path should be unreachable.', {
			suggestion: 'This is a bug, please report it.',
		});
	}
}
