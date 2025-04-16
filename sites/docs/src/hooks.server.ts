import { redirect, type RequestEvent } from '@sveltejs/kit';

export function handle({ event, resolve }) {
	redirects(event);

	return resolve(event);
}

/** Handle redirects from pages that no longer exist that are worth fixing */
function redirects(event: RequestEvent) {
	if (event.url.pathname.startsWith('/registry')) {
		const registry = event.url.searchParams.get('url');

		if (registry !== null) {
			redirect(303, `/registries/${registry}`);
		} else {
			redirect(303, '/registries/');
		}
	}
}
