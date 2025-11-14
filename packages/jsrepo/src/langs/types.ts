import type { Ecosystem, LocalDependency, RemoteDependency, UnresolvedImport } from '@/utils/build';
import type { RegistryItemType } from '@/utils/config';
import type { AbsolutePath, ItemRelativePath } from '@/utils/types';

export type ResolveDependenciesOptions = {
	fileName: AbsolutePath;
	cwd: AbsolutePath;
	excludeDeps: string[];
	warn: (log: string) => void;
};

export type InstallDependenciesOptions = {
	cwd: AbsolutePath;
};

export type TransformImportsOptions = {
	cwd: AbsolutePath;
	/** The path of the file that the imports will be transformed for. */
	targetPath: string;
	getItemPath(opts: { item: string; file: { type: RegistryItemType; path: ItemRelativePath } }): {
		/** The resolved path of the dependency. */
		path: string;
		/** The alias of the dependency. */
		alias?: string;
	};
};

export type ImportTransform = {
	/** The pattern to match the import. */
	pattern: string | RegExp;
	/** The replacement for the import. */
	replacement: string;
};

export type ResolveDependenciesResult = {
	localDependencies: LocalDependency[];
	dependencies: RemoteDependency[];
	devDependencies: RemoteDependency[];
};

export interface Language {
	/** The name of the language. */
	name: string;
	/** Determines whether or not the language can resolve dependencies for the given file. */
	canResolveDependencies(fileName: string): boolean;
	resolveDependencies(
		code: string,
		opts: ResolveDependenciesOptions
	): Promise<ResolveDependenciesResult> | ResolveDependenciesResult;
	/** Returns an object where the key is the import to be transformed and the value is the transformed import. */
	transformImports(
		_imports_: UnresolvedImport[],
		opts: TransformImportsOptions
	): Promise<ImportTransform[]> | ImportTransform[];

	/** Determines whether or not the language can install dependencies for the given ecosystem. */
	canInstallDependencies(ecosystem: Ecosystem): boolean;
	/** Gets the install command to add the given dependencies to the project. */
	installDependencies(
		dependencies: { dependencies: RemoteDependency[]; devDependencies: RemoteDependency[] },
		opts: InstallDependenciesOptions
	): Promise<void> | void;
}
