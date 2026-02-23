import { log } from '@clack/prompts';
import pc from 'picocolors';
import type { Config } from '@/utils/config';

/**
 * Base warning class. All warnings should extend this class.
 */
export class Warning {
	constructor(public readonly message: string) {}
}

/**
 * Type for a warning handler function.
 */
export type WarningHandler = (warning: Warning) => void;

/**
 * Warning when a language cannot be found to resolve dependencies for a file.
 */
export class LanguageNotFoundWarning extends Warning {
	public readonly path: string;
	constructor(options: { path: string }) {
		super(`Couldn't find a language to resolve dependencies for ${options.path}.`);
		this.path = options.path;
	}
}

/**
 * Warning when an import is skipped because it's not a valid package name or path alias.
 */
export class InvalidImportWarning extends Warning {
	public readonly specifier: string;
	public readonly fileName: string;
	constructor(options: { specifier: string; fileName: string }) {
		super(
			`Skipped adding import \`${pc.cyan(options.specifier)}\` from ${options.fileName}. Reason: Not a valid package name or path alias.`
		);
		this.specifier = options.specifier;
		this.fileName = options.fileName;
	}
}

/**
 * Warning when a dynamic import cannot be resolved due to unresolvable syntax.
 */
export class UnresolvableDynamicImportWarning extends Warning {
	public readonly specifier: string;
	public readonly fileName: string;
	constructor(options: { specifier: string; fileName: string }) {
		super(
			`Skipping ${pc.cyan(options.specifier)} from ${pc.bold(options.fileName)}. Reason: Unresolvable syntax. 💡 consider manually including the modules expected to be resolved by this import in your registry dependencies.`
		);
		this.specifier = options.specifier;
		this.fileName = options.fileName;
	}
}

/**
 * Warning when a glob pattern doesn't match any files.
 */
export class GlobPatternNoMatchWarning extends Warning {
	public readonly itemName: string;
	public readonly pattern: string;
	constructor(options: { itemName: string; pattern: string }) {
		super(
			`The glob pattern defined in ${pc.bold(options.itemName)}: ${pc.bold(options.pattern)} didn't match any files.`
		);
		this.itemName = options.itemName;
		this.pattern = options.pattern;
	}
}

/**
 * Creates a warning handler that uses the onwarn callback if provided, otherwise uses the default logger.
 */
export function createWarningHandler(onwarn?: Config['build']['onwarn']): WarningHandler {
	return (warning: Warning) => {
		if (!onwarn) {
			log.warn(warning.message);
		} else {
			onwarn(warning, (w) => log.warn(w.message));
		}
	};
}
