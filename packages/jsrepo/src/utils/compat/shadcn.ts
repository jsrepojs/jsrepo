import type { ImportTransform } from '@/api/langs';
import { createImportPattern, createReplacement } from '@/langs/js';
import type { AbsolutePath } from '@/utils/types';

const SUPPORTED_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

/**
 * Ripped from: https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/utils/transformers/transform-import.ts
 */

type Config = {
	aliases: {
		components: string | undefined;
		utils: string | undefined;
		ui: string | undefined;
		lib: string | undefined;
		hooks: string | undefined;
	};
};

export async function transformShadcnImports({
	code,
	imports,
	fileName,
	config,
}: {
	code: string;
	imports: string[];
	fileName: AbsolutePath;
	config: Config;
}): Promise<string> {
	if (!endsWithOneOf(fileName, SUPPORTED_EXTENSIONS)) return code;

	const transformedImports: ImportTransform[] = [];

	for (const specifier of imports) {
		const updated = updateImportAliases(specifier, config);

		transformedImports.push({
			pattern: createImportPattern(specifier),
			replacement: createReplacement(updated),
		});
	}

	for (const transformation of transformedImports) {
		code = code.replace(transformation.pattern, transformation.replacement);
	}

	return code;
}

function updateImportAliases(moduleSpecifier: string, config: Config) {
	// Not a local import.
	if (!moduleSpecifier.startsWith('@/')) {
		return moduleSpecifier;
	}

	if (config.aliases.ui || config.aliases.components) {
		if (moduleSpecifier.match(/^@\/registry\/(.+)\/ui/)) {
			return moduleSpecifier.replace(
				/^@\/registry\/(.+)\/ui/,
				config.aliases.ui ?? `${config.aliases.components}/ui`
			);
		}
	}

	if (config.aliases.components && moduleSpecifier.match(/^@\/registry\/(.+)\/components/)) {
		return moduleSpecifier.replace(/^@\/registry\/(.+)\/components/, config.aliases.components);
	}

	if (config.aliases.lib && moduleSpecifier.match(/^@\/registry\/(.+)\/lib/)) {
		return moduleSpecifier.replace(/^@\/registry\/(.+)\/lib/, config.aliases.lib);
	}

	if (config.aliases.hooks && moduleSpecifier.match(/^@\/registry\/(.+)\/hooks/)) {
		return moduleSpecifier.replace(/^@\/registry\/(.+)\/hooks/, config.aliases.hooks);
	}

	return moduleSpecifier;
}

function endsWithOneOf(fileName: string, extensions: string[]): boolean {
	return extensions.some((extension) => fileName.endsWith(extension));
}
