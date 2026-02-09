export function resolveWithRoles(options: {
	with?: string[];
	/** @deprecated kept for backward compatibility */
	withExamples?: boolean;
	/** @deprecated kept for backward compatibility */
	withDocs?: boolean;
	/** @deprecated kept for backward compatibility */
	withTests?: boolean;
}): Set<string> {
	const withRoles = new Set(options.with ?? []);
	if (options.withExamples) withRoles.add('example');
	if (options.withDocs) withRoles.add('doc');
	if (options.withTests) withRoles.add('test');
	return withRoles;
}

export function shouldIncludeRole(role: string | undefined, withRoles: Set<string>): boolean {
	if (!role || role === 'file') return true;
	return withRoles.has(role);
}

export function isOptionalRole(role: string | undefined): boolean {
	return !!role && role !== 'file';
}
