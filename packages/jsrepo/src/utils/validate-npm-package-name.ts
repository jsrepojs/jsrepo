import { builtinModules } from 'node:module';

interface ValidationResult {
	validForNewPackages: boolean;
	validForOldPackages: boolean;
	warnings?: string[];
	errors?: string[];
}

const scopedPackagePattern = /^(?:@([^/]+?)[/])?([^/]+?)$/;
const exclusionList = ['node_modules', 'favicon.ico'];

export function validateNpmPackageName(name: string | null | undefined): ValidationResult {
	const warnings: string[] = [];
	const errors: string[] = [];

	if (name === null) {
		errors.push('name cannot be null');
		return done(warnings, errors);
	}

	if (name === undefined) {
		errors.push('name cannot be undefined');
		return done(warnings, errors);
	}

	if (typeof name !== 'string') {
		errors.push('name must be a string');
		return done(warnings, errors);
	}

	if (!name.length) {
		errors.push('name length must be greater than zero');
	}

	if (name.startsWith('.')) {
		errors.push('name cannot start with a period');
	}

	if (name.match(/^_/)) {
		errors.push('name cannot start with an underscore');
	}

	if (name.trim() !== name) {
		errors.push('name cannot contain leading or trailing spaces');
	}

	// No funny business
	exclusionList.forEach((excludedName) => {
		if (name.toLowerCase() === excludedName) {
			errors.push(`${excludedName} is not a valid package name`);
		}
	});

	// Generate warnings for stuff that used to be allowed

	// core module names like http, events, util, etc
	if (builtinModules.includes(name.toLowerCase())) {
		warnings.push(`${name} is a core module name`);
	}

	if (name.length > 214) {
		warnings.push('name can no longer contain more than 214 characters');
	}

	// mIxeD CaSe nAMEs
	if (name.toLowerCase() !== name) {
		warnings.push('name can no longer contain capital letters');
	}

	const lastSegment = name.split('/').slice(-1)[0];
	if (lastSegment && /[~'!()*]/.test(lastSegment)) {
		warnings.push('name can no longer contain special characters ("~\'!()*")');
	}

	if (encodeURIComponent(name) !== name) {
		// Maybe it's a scoped package name, like @user/package
		const nameMatch = name.match(scopedPackagePattern);
		if (nameMatch) {
			const user = nameMatch[1];
			const pkg = nameMatch[2];

			if (pkg?.startsWith('.')) {
				errors.push('name cannot start with a period');
			}

			if (
				user &&
				pkg &&
				encodeURIComponent(user) === user &&
				encodeURIComponent(pkg) === pkg
			) {
				return done(warnings, errors);
			}
		}

		errors.push('name can only contain URL-friendly characters');
	}

	return done(warnings, errors);
}

const done = (warnings: string[], errors: string[]): ValidationResult => {
	const result: ValidationResult = {
		validForNewPackages: errors.length === 0 && warnings.length === 0,
		validForOldPackages: errors.length === 0,
		warnings: warnings,
		errors: errors,
	};
	if (result.warnings && !result.warnings.length) {
		delete result.warnings;
	}
	if (result.errors && !result.errors.length) {
		delete result.errors;
	}
	return result;
};
