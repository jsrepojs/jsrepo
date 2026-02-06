export function resolveWithRoles(
	roles: string[] | undefined,
	legacy: { withExamples?: boolean; withDocs?: boolean; withTests?: boolean } = {}
): Set<string> {
	const withRoles = new Set(roles ?? []);
	if (legacy.withExamples) withRoles.add('example');
	if (legacy.withDocs) withRoles.add('doc');
	if (legacy.withTests) withRoles.add('test');
	return withRoles;
}

export function shouldIncludeRole(role: string | undefined, withRoles: Set<string>): boolean {
	if (!role || role === 'file') return true;
	return withRoles.has(role);
}

export function isOptionalRole(role: string | undefined): boolean {
	return !!role && role !== 'file';
}
