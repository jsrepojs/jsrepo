const ROLE_ALIASES: Record<string, string> = {
	examples: 'example',
	docs: 'doc',
	tests: 'test',
};

export function normalizeRole(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	return trimmed.toLowerCase();
}

export function normalizeRoleName(value: string | undefined): string | undefined {
	const normalized = normalizeRole(value);
	if (!normalized) return undefined;
	return ROLE_ALIASES[normalized] ?? normalized;
}

export function normalizeWithRoles(
	roles: string[] | undefined,
	legacy: { withExamples?: boolean; withDocs?: boolean; withTests?: boolean } = {}
): Set<string> {
	const normalized = new Set<string>();
	for (const role of roles ?? []) {
		const canonical = normalizeRoleName(role);
		if (canonical) normalized.add(canonical);
	}

	if (legacy.withExamples) normalized.add('example');
	if (legacy.withDocs) normalized.add('doc');
	if (legacy.withTests) normalized.add('test');

	return normalized;
}

export function shouldIncludeRole(role: string | undefined, withRoles: Set<string>): boolean {
	const normalized = normalizeRoleName(role);
	if (!normalized || normalized === 'file') return true;
	return withRoles.has(normalized);
}

export function isOptionalRole(role: string | undefined): boolean {
	const normalized = normalizeRoleName(role);
	return !!normalized && normalized !== 'file';
}
