import { selectProvider } from 'jsrepo';

export function match(value) {
	const provider = selectProvider(value);

	return provider !== undefined;
}
