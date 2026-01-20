import { log } from '@clack/prompts';
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
	constructor(message: string, options: { path: string }) {
		super(message);
		this.path = options.path;
	}
}

/**
 * Warning when an import is skipped because it's not a valid package name or path alias.
 */
export class InvalidImportWarning extends Warning {
	public readonly specifier: string;
	public readonly fileName: string;
	constructor(message: string, options: { specifier: string; fileName: string }) {
		super(message);
		this.specifier = options.specifier;
		this.fileName = options.fileName;
	}
}

/**
 * Warning when a dynamic import cannot be resolved due to unresolvable syntax.
 */
export class UnresolvableDynamicImportWarning extends Warning {
	public readonly fullImport: string;
	public readonly fileName: string;
	constructor(message: string, options: { fullImport: string; fileName: string }) {
		super(message);
		this.fullImport = options.fullImport;
		this.fileName = options.fileName;
	}
}

/**
 * Creates a warning handler that uses the onwarn callback if provided, otherwise uses the default logger.
 */
export function createWarningHandler(onwarn?: Config['onwarn']): WarningHandler {
	return (warning: Warning) => {
		if (!onwarn) {
			log.warn(warning.message);
		} else {
			onwarn(warning, (w) => log.warn(w.message));
		}
	};
}
